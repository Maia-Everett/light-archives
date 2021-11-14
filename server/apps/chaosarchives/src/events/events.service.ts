import { UserInfo } from '@app/auth/model/user-info';
import { Character, Event, EventLocation, Server } from '@app/entity';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { EventSummariesDto } from '@app/shared/dto/events/event-summaries.dto';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { EventDto } from '@app/shared/dto/events/event.dto';
import { EventSource } from '@app/shared/enums/event-source.enum';
import html from '@app/shared/html';
import SharedConstants from '@app/shared/SharedConstants';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime, Duration } from 'luxon';
import { Connection, EntityManager, In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import utils from '../common/utils';
import { ChocoboChronicleService } from './chocobo-chronicle.service';
import { CrescentMoonPublishingService } from './crescent-moon-publishing.service';
import { ExternalEvent } from './model/external-event';

@Injectable()
export class EventsService {
	private readonly CACHE_DURATION_SHORT_MS = Duration.fromObject({ minutes: 5 }).toMillis();

	private readonly MAX_RESULTS = 10;

	constructor(
		private readonly cmpService: CrescentMoonPublishingService,
		private readonly ccService: ChocoboChronicleService,
		private readonly connection: Connection,
		@InjectRepository(Event)
		private readonly eventRepo: Repository<Event>,
		@InjectRedis()
		private readonly redisService: Redis,
	) { }

	async getEvent(id: number, user?: UserInfo): Promise<EventDto> {
		// TODO: optimize query
		const event = await this.eventRepo.findOne({
			where: {
				id,
			},
			relations: [ 'owner', 'owner.user', 'locations', 'locations.server' ]
		});

		if (!event) {
			throw new NotFoundException('Event not found');
		}

		const location = event.locations.length > 0 ? event.locations[0] : null;

		return new EventDto({
			title: event.title,
			mine: !!event.owner && event.owner.user.id === user?.id,
			details: event.details,
			oocDetails: event.oocDetails,
			startDateTime: event.startDateTime.getTime(),
			endDateTime: event.endDateTime ? event.endDateTime.getTime() : null,
			link: event.externalSourceLink || event.link,
			contact: event.contact,
			locationName: location ? location.name : '',
			locationAddress: location ? location.address : '',
			locationServer: location ? location.server.name : '',
			locationTags: location ? location.tags : '',
		});
	}

  async createEvent(eventDto: EventDto, characterId: number, user: UserInfo): Promise<IdWrapper> {
    const eventEntity = await this.connection.transaction(async em => {
			const character = await em.getRepository(Character).findOne({
				id: characterId,
				user: {
					id: user.id
				},
				verifiedAt: Not(IsNull())
			});

			if (!character) {
				throw new BadRequestException('Invalid character ID');
			}

			const event = new Event();
			event.locations = [];
			event.owner = character;
			event.source = EventSource.WEBSITE;
			await this.updateEventInternal(em, event, eventDto);
			return event;
		});

		return { id: eventEntity.id };
  }

  async updateEvent(eventId: number, eventDto: EventDto, user: UserInfo): Promise<void> {
    await this.connection.transaction(async em => {
			const event = await em.getRepository(Event).findOne({
				where: {
					id: eventId,
					owner: {
						user: {
							id: user.id
						}
					},
				},
				relations: [ 'owner', 'locations', 'locations.server' ]
			});

			if (!event) {
				throw new NotFoundException('Event not found');
			}

			await this.updateEventInternal(em, event, eventDto);
		});
  }

	private async updateEventInternal(em: EntityManager, eventEntity: Event, eventDto: EventDto): Promise<void> {
		const event = eventEntity;
		event.title = eventDto.title;
		event.startDateTime = new Date(eventDto.startDateTime);
		event.endDateTime = eventDto.endDateTime ? new Date(eventDto.endDateTime) : null;
		event.details = html.sanitize(eventDto.details);
		event.oocDetails = html.sanitize(eventDto.oocDetails);
		event.link = eventDto.link; // TODO: Validate
		event.contact = eventDto.contact;

		let location: EventLocation;

		if (event.locations.length > 0) {
			location = event.locations[0];
		} else {
			location = new EventLocation();
			location.event = event;
			event.locations.push(location);
		}

		location.name = eventDto.locationName;
		location.address = eventDto.locationAddress;
		location.tags = eventDto.locationTags;

		const server = await em.getRepository(Server).findOne({
			where: {
				name: eventDto.locationServer
			}
		});

		if (!server) {
			throw new BadRequestException(`Server ${eventDto.locationServer} not found`);
		}

		location.server = server;

		await em.getRepository(Event).save(event);
	}

	async getEvents(refreshExternal = false): Promise<EventSummariesDto> {
		const eventsTimestamp = await this.redisService.get('eventsTimestamp');
		let eventsUpToDate = false;

		if (eventsTimestamp) {
			const date = DateTime.fromMillis(parseInt(eventsTimestamp, 10));

			if (DateTime.now().diff(date).toMillis() <= this.CACHE_DURATION_SHORT_MS) {
				eventsUpToDate = true;
			}
		}

		if (!refreshExternal || eventsUpToDate) {
			return {
				events: await this.getEventsFromDatabase(),
				eventsUpToDate
			};
		}

		// Not cached - fetch and cache
		// CMP events are disabled for now until we can test them with the new event system again
		const [/* cmpEvents, */ ccEvents] = await Promise.all([
			// this.cmpService.fetchEvents(),
			this.ccService.fetchEvents(),
		]);
		
		const events = [ /* ...cmpEvents, */ ...ccEvents ]
				.sort((e1, e2) => utils.compareNumbers(e1.startDateTime, e2.startDateTime));
		await this.saveEvents(events);
		await this.redisService.set('eventsTimestamp', Date.now().toString());
		return { 
			events: await this.getEventsFromDatabase(),
			eventsUpToDate: true
		};
	}

	private async getEventsFromDatabase(): Promise<EventSummaryDto[]> {
		const startOfDay = DateTime.now().setZone(SharedConstants.FFXIV_SERVER_TIMEZONE).startOf('day');
		const events = await this.eventRepo.find({
			where: {
				startDateTime: MoreThanOrEqual(startOfDay.toJSDate()),
				hidden: false,
			},
			order: {
				startDateTime: 'ASC',
				createdAt: 'ASC'
			},
			take: this.MAX_RESULTS,
			relations: [ 'locations', 'locations.server' ]
		});

		return events.map(event => this.toEventDto(event));
	}

	private async saveEvents(events: ExternalEvent[]): Promise<void> {
		if (events.length === 0) {
			return;
		}

		await this.connection.transaction(async em => {
			const links = events.map(event => event.link);
			const eventRepo = em.getRepository(Event);
			const existingEvents = await eventRepo.find({
				where: {
					externalSourceLink: In(links),
				},
				relations: [ 'locations' ]
			});
			const existingEventsByLink = new Map<string, Event>();

			for (const existingEvent of existingEvents) {
				existingEventsByLink.set(existingEvent.externalSourceLink, existingEvent);
			}

			const savedEvents: Event[] = [];
			const serverNames = new Set(events.map(event => event.locations.map(location => location.server)).flat());
			const serversByName = new Map<string, Server>();

			if (serverNames.size > 0) {
				const servers = await em.getRepository(Server).find({
					where: {
						name: In(Array.from(serverNames))
					}
				});

				for (const server of servers) {
					serversByName.set(server.name, server);
				}
			}			

			for (const eventDto of events) {
				const event = existingEventsByLink.get(eventDto.link) || eventRepo.create({
					locations: []
				});

				event.title = eventDto.title;
				event.details = html.sanitize(eventDto.details);
				event.startDateTime = new Date(eventDto.startDateTime);
				event.endDateTime = eventDto.endDateTime ? new Date(eventDto.endDateTime) : null;
				event.source = eventDto.source;
				event.externalSourceLink = eventDto.link;

				const dtoLocations = eventDto.locations;

				if (event.locations.length > dtoLocations.length) {
					event.locations.splice(dtoLocations.length, event.locations.length - dtoLocations.length);
				} else if (event.locations.length < dtoLocations.length) {
					for (let i = event.locations.length; i < dtoLocations.length; i++) {
						const location = new EventLocation();
						location.event = event;
						event.locations.push(location);
					}
				}

				for (let i = 0; i < dtoLocations.length; i++) {
					const location = event.locations[i];
					const locationDto = dtoLocations[i];

					location.name = locationDto.name;
					location.address = locationDto.address;
					location.tags = locationDto.tags;

					const server = serversByName.get(locationDto.server);

					if (!server) {
						throw new BadRequestException(`World server not found: ${server}`);
					}

					location.server = server;
				}

				savedEvents.push(event);
			}

			await eventRepo.save(savedEvents);
		});
	}

	private toEventDto(event: Event): EventSummaryDto {
		return {
			id: event.id,
			title: event.title,
			startDateTime: event.startDateTime.getTime(),
			endDateTime: event.endDateTime ? event.endDateTime.getTime() : null,
			link: event.externalSourceLink || '',
			source: event.source,
			locations: event.locations.map(location => ({
				id: location.id,
				name: location.name,
				address: location.address,
				server: location.server?.name || '',
				tags: location.tags
			}))
		};
	}
}
