import { AuthService } from '@app/auth/auth.service';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { UserInfo } from '@app/auth/model/user-info';
import { Character, CommunityMembership, Image, Server, User } from '@app/entity';
import { generateVerificationCode } from '@app/security';
import { AddCharacterRequestDto } from '@app/shared/dto/characters/add-character-request.dto';
import { BannerDto } from '@app/shared/dto/characters/banner.dto';
import { CharacterProfileFilterDto } from '@app/shared/dto/characters/character-profile-filter.dto';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { CharacterRefreshResultDto } from '@app/shared/dto/characters/character-refresh-result.dto';
import { CharacterRegistrationStatusResultDto } from '@app/shared/dto/characters/character-registration-status-result.dto';
import { CharacterSummaryDto } from '@app/shared/dto/characters/character-summary.dto';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { CharacterRegistrationStatus } from '@app/shared/enums/character-registration-status.enum';
import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { getRaceByName } from '@app/shared/enums/race.enum';
import html from '@app/shared/html';
import SharedConstants from '@app/shared/SharedConstants';
import { BadRequestException, ConflictException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, IsNull, Not, Repository } from 'typeorm';
import { checkCarrdProfile } from '../../../common/api-checks';
import { andWhereExists, escapeForLike, isQueryFailedError } from '../../../common/db';
import { ImagesService } from '../images/images.service';
import { getTribeByName } from '@app/shared/enums/tribe.enum';
import { LodestoneService } from '../lodestone/lodestone.service';

@Injectable()
export class CharactersService {
  constructor(
    private publicAuthService: AuthService,
    private imagesService: ImagesService,
    private lodestoneService: LodestoneService,
    private connection: Connection,
    @InjectRepository(Character) private characterRepo: Repository<Character>,
    @InjectRepository(CommunityMembership) private communityMembershipRepo: Repository<CommunityMembership>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getCharacterProfile(
    name: string,
    server: string,
    @CurrentUser() user?: UserInfo,
  ): Promise<CharacterProfileDto> {
    const character = await this.characterRepo
      .createQueryBuilder('character')
      .innerJoinAndSelect('character.server', 'server')
      .innerJoinAndSelect('character.user', 'user')
      .leftJoinAndSelect('character.freeCompany', 'freeCompany')
      .leftJoinAndSelect('freeCompany.server', 'fcServer')
      .where('character.verifiedAt IS NOT NULL')
      .andWhere('character.name = :name', { name })
      .andWhere('server.name = :server', { server })
      .select(['character', 'server.name', 'user.id', 'freeCompany', 'fcServer.name' ])
      .getOne();

    if (!character) {
      throw new NotFoundException('Character not found');
    }

		// TODO: Refactor
    const banner = await character.banner;

    if (banner) {
      banner.owner = character; // hack, needed to determine URL - TypeORM won't load banner.owner by itself
    }

    const freeCompany = await character.freeCompany;

    return {
      id: character.id,
      mine: !!user && character.user.id === user.id,
      name: character.name,
      race: character.race,
      tribe: character.tribe,
      deity: character.deity,
      family: character.family,
      relationsshipstatus: character.relationsshipstatus,
      server: character.server.name,
      avatar: character.avatar,
      lodestoneId: character.lodestoneId,
      active: character.active || false,
      appearance: character.appearance,
      aether: character.aether,
      background: character.background,
      haircolor: character.haircolor,
      eyecolor: character.eyecolor,
      skintone: character.skintone, 
      build: character.build,
      height: character.height,
      weight: character.weight,
      voice:  character.voice,
      specialfeatures: character.specialfeatures,
      personality: character.personality,
      possession: character.possession,
      specialitems: character.specialitems,
      strengths: character.strengths,
      weaknesses: character.weaknesses,
      fears: character.fears,
      wishes: character.wishes,
      ticks: character.ticks,
      partners : character.partners,
      parents: character.parents,
      children: character.children,
      acquaintances: character.acquaintances,
      past: character.past,
      freecompanies: character.freecompanies,
      meetingplaces: character.meetingplaces,
      communities:  character.communities,
      mentioned: character.mentioned,
      openinformation: character.openinformation,
      commonrumors: character.commonrumors,
      rarerumors: character.rarerumors,
      profession: character.profession,
      age: character.age,
      apparentage: character.apparentage,
      birthday: character.birthday,
      birthplace: character.birthplace,
      residence: character.residence,
      title: character.title,
      nickname: character.nickname,
      pronouns: character.pronouns,
      slogan: character.slogan,
      friends: character.friends,
      relatives: character.relatives,
      enemies: character.enemies,
      loves: character.loves,
      hates: character.hates,
      motivation: character.motivation,
      carrdProfile: character.carrdProfile,
      banner: !banner ? null : new BannerDto({
        id: banner.id,
        url: this.imagesService.getUrl(banner),
        width: banner.width,
        height: banner.height
      }),
      showAvatar: character.showAvatar,
      showInfoboxes: character.showInfoboxes,
      showAppearance: character.showAppearance,
      showContacts: character.showContacts,
      showDiary: character.showDiary,
      showGallery: character.showGallery,
      showPersonality: character.showPersonality,
      showRumors: character.showRumors,
      showInventory: character.showInventory,
      combinedDescription: character.combinedDescription,
      freeCompany: !freeCompany ? null : {
        name: freeCompany.name,
        server: freeCompany.server.name
      },
    };
  }

  async getCharacterProfileById(
    id: number,
    @CurrentUser() user?: UserInfo,
  ): Promise<CharacterProfileDto> {
    const character = await this.characterRepo
      .createQueryBuilder('character')
      .innerJoinAndSelect('character.server', 'server')
      .innerJoinAndSelect('character.user', 'user')
      .leftJoinAndSelect('character.freeCompany', 'freeCompany')
      .leftJoinAndSelect('freeCompany.server', 'fcServer')
      .where('character.verifiedAt IS NOT NULL')
      .andWhere('character.id = :id', { id })
      .select(['character', 'server.name', 'user.id', 'freeCompany', 'fcServer.name' ])
      .getOne();

    if (!character) {
      throw new NotFoundException('Character not found');
    }

		// TODO: Refactor
    const banner = await character.banner;

    if (banner) {
      banner.owner = character; // hack, needed to determine URL - TypeORM won't load banner.owner by itself
    }

    const freeCompany = await character.freeCompany;

    return {
      id: character.id,
      mine: !!user && character.user.id === user.id,
      name: character.name,
      race: character.race,
      tribe: character.tribe,
      server: character.server.name,
      avatar: character.avatar,
      lodestoneId: character.lodestoneId,
      active: character.active || false,
      appearance: character.appearance,
      background: character.background,
      haircolor: character.haircolor,
      eyecolor: character.eyecolor,
      skintone: character.skintone, 
      build: character.build,
      height: character.height,
      weight: character.weight,
      voice:  character.voice,
      aether: character.aether,
      birthday: character.birthday,
      children: character.children,
      deity: character.deity,
      family: character.family,
      fears: character.fears,
      openinformation : character.openinformation,
      parents: character.parents,
      personality: character.personality,
      possession: character.possession,
      relationsshipstatus : character.relationsshipstatus,
      wishes: character.wishes,
      specialitems: character.specialitems,
      specialfeatures: character.specialfeatures,
      strengths: character.strengths,
      weaknesses: character.weaknesses,
      ticks: character.ticks,
      partners  : character.partners,
      acquaintances: character.acquaintances,
      past: character.past,
      freecompanies: character.freecompanies,
      meetingplaces: character.meetingplaces,
      communities:  character.communities,
      mentioned: character.mentioned,
      commonrumors: character.commonrumors,
      rarerumors: character.rarerumors,
      profession: character.profession,
      apparentage: character.apparentage,
      age: character.age,
      birthplace: character.birthplace,
      residence: character.residence,
      title: character.title,
      nickname: character.nickname,
      pronouns: character.pronouns,
      slogan: character.slogan,
      friends: character.friends,
      relatives: character.relatives,
      enemies: character.enemies,
      loves: character.loves,
      hates: character.hates,
      motivation: character.motivation,
      carrdProfile: character.carrdProfile,
      banner: !banner ? null : new BannerDto({
        id: banner.id,
        url: this.imagesService.getUrl(banner),
        width: banner.width,
        height: banner.height
      }),
      showAvatar: character.showAvatar,
      showInfoboxes: character.showInfoboxes,
      showAppearance: character.showAppearance,
      showContacts: character.showContacts,
      showDiary: character.showDiary,
      showGallery: character.showGallery,
      showPersonality: character.showPersonality,
      showRumors: character.showRumors,
      showInventory: character.showInventory,
      combinedDescription: character.combinedDescription,
      freeCompany: !freeCompany ? null : {
        name: freeCompany.name,
        server: freeCompany.server.name
      },
    };
  }

  async saveCharacter(characterDto: CharacterProfileDto, user: UserInfo): Promise<void> {
    const characterEntity = await this.connection.transaction(async em => {
			const repo = em.getRepository(Character);
			const character = await repo.findOne({
        where: {
          id: characterDto.id,
          user: {
            id: user.id,
          },
          verifiedAt: Not(IsNull())
        },
        relations: [ 'server' ]
      });

			if (!character) {
				throw new NotFoundException('Character not found');
			}

			// TODO: Refactor
			Object.assign(character, {
				appearance: html.sanitize(characterDto.appearance),
        background: html.sanitize(characterDto.background),
        haircolor: characterDto.haircolor,
        eyecolor: characterDto.eyecolor,
        skintone: characterDto.skintone,
        build: characterDto.build,
        height: characterDto.height,
        weight: characterDto.weight,
        voice: characterDto.voice,
        aether: characterDto.aether,
        birthday: characterDto.birthday,
        children: characterDto.children,
        deity: characterDto.deity,
        family: characterDto.family,
        fears: characterDto.fears,
        openinformation: characterDto.openinformation,
        parents: characterDto.parents,
        personality: characterDto.personality,
        possession: characterDto.possession,
        relationsshipstatus: characterDto.relationsshipstatus,
        wishes: characterDto.wishes,
        specialitems: characterDto.specialitems,
        specialfeatures: characterDto.specialfeatures,
        strengths: characterDto.strengths,
        weaknesses: characterDto.weaknesses,
        ticks: characterDto.ticks,
        partners: characterDto.partners,
        acquaintances: characterDto.acquaintances,
        past: characterDto.past,
        freecompanies: characterDto.freecompanies,
        meetingplaces: characterDto.meetingplaces,
        communities: characterDto.communities,
        mentioned: characterDto.mentioned,
        commonrumors: html.sanitize(characterDto.commonrumors),
        rarerumors: html.sanitize(characterDto.rarerumors),
        profession: characterDto.profession,
        apparentage: characterDto.apparentage,
				age: characterDto.age,
				birthplace: characterDto.birthplace,
				residence: characterDto.residence,
				title: characterDto.title,
				nickname: characterDto.nickname,
        pronouns: characterDto.pronouns,
				slogan: characterDto.slogan,
        friends: characterDto.friends,
        relatives: characterDto.relatives,
        enemies: characterDto.enemies,
				loves: characterDto.loves,
				hates: characterDto.hates,
				motivation: characterDto.motivation,
        carrdProfile: checkCarrdProfile(characterDto.carrdProfile, user),
        showAvatar: characterDto.showAvatar,
        showInfoboxes: characterDto.showInfoboxes,
        showAppearance: characterDto.showAppearance,
        showPersonality: characterDto.showPersonality,
        showContacts: characterDto.showContacts,
        showRumors: characterDto.showRumors,
        showDiary: characterDto.showDiary,
        showGallery: characterDto.showGallery,
        showInventory: characterDto.showInventory,
        combinedDescription: characterDto.combinedDescription,
			});

      if (characterDto.banner && characterDto.banner.id) {
        const banner = await em.getRepository(Image).findOne({
          where: {
            id: characterDto.banner.id,
            owner: character
          }
        });

        if (!banner) {
          throw new BadRequestException('Banner not found');
        }

        if (banner.width / banner.height < SharedConstants.MIN_BANNER_ASPECT_RATIO) {
          throw new BadRequestException('Banner is too tall for its width');
        }

        character.banner = Promise.resolve(banner);
      } else {
        character.banner = Promise.resolve(null as unknown as Image);
      }

			return repo.save(character);
		});

    void this.eventEmitter.emitAsync('character.updated', characterEntity);
  }

  async getCharacterList(filter: CharacterProfileFilterDto): Promise<PagingResultDto<CharacterSummaryDto>> {
		const query = this.characterRepo.createQueryBuilder('character')
			.where('character.verifiedAt IS NOT NULL')
			.orderBy('character.name', 'ASC')
			.innerJoinAndSelect('character.server', 'server')
			.select([ 'character.name', 'character.profession', 'character.race', 'character.avatar', 'server.name' ]);

    if (filter.searchQuery) {
      query.andWhere(`(character.name LIKE :searchQuery OR character.profession LIKE :searchQuery)`,
        { searchQuery:  `%${escapeForLike(filter.searchQuery)}%` });
    }

    if (filter.race) {
      query.andWhere('character.race = :race', { race: filter.race });
    }

    if (filter.server) {
      query.andWhere('character.server = :server', { server: filter.server });
    }

    if (filter.freeCompanyId) {
      query.andWhere('character.freeCompany.id = :freeCompanyId', { freeCompanyId: filter.freeCompanyId });
    }

    if (filter.communityId) {
      andWhereExists(query, this.communityMembershipRepo.createQueryBuilder('membership')
        .innerJoinAndSelect('membership.character', 'mch')
        .innerJoinAndSelect('membership.community', 'mcm')
        .where('mch.id = character.id')
        .andWhere('mcm.id = :communityId', { communityId: filter.communityId })
        .andWhere('membership.status = :membershipStatus', { membershipStatus: MembershipStatus.CONFIRMED })
        .select('1'));
    }

    const total = await query.getCount();

    if (filter.offset) {
      query.offset(filter.offset);
    }

    if (filter.limit) {
      query.limit(filter.limit);
    }
    
    const characters = await query.getMany();

		return {
      total,
      data: characters.map(character => ({
				name: character.name,
        profession: character.profession,
				race: character.race,
        tribe: character.tribe,
				avatar: character.avatar,
				server: character.server.name,
			}))
    };
	}

  async refreshCharacter(characterId: IdWrapper, user: UserInfo): Promise<CharacterRefreshResultDto> {
    // Note that we intentionally don't check if the character is verified.
    // It is safe to update the Lodestone info of unverified characters,
    // though unverified users cannot access this API via the website.
		const characterEntity = await this.connection.transaction(async em => {
			const repo = em.getRepository(Character);
			const character = await repo.findOneBy({
				id: characterId.id,
				user: {
					id: user.id,
				},
			});

			if (!character) {
				throw new NotFoundException('Character not found');
			}

      if (!character.active) {
        throw new ConflictException('You cannot refresh inactive characters from Lodestone');
      }

      const lodestoneInfo = await this.lodestoneService.getCharacter(character.lodestoneId);

      if (!lodestoneInfo) {
        throw new GoneException('Character not found on Lodestone');
      }

      const server = await em.getRepository(Server).findOne({
        where: {
          name: lodestoneInfo.World,
        },
        select: [ 'id', 'name' ]
      });

      if (!server) {
        throw new NotFoundException(`Unknown server: ${lodestoneInfo.World}`);
      }
      // Info parsed from Lodestone - update it in database
			Object.assign(character, {
        name: lodestoneInfo.Name,
        race: getRaceByName(lodestoneInfo.Race),
        tribe: getTribeByName(lodestoneInfo.Tribe),
        avatar: lodestoneInfo.Avatar,
				server,
			});

			await repo.save(character);

      // But that's not all! We need to invalidate the session cache, since character data is cached there.
      await this.publicAuthService.notifyUserChanged(user.id);

      return character;
		});

    void this.eventEmitter.emitAsync('character.updated', characterEntity);

    return {
      name: characterEntity.name,
      race: characterEntity.race,
      tribe: characterEntity.tribe,
      avatar: characterEntity.avatar,
      server: characterEntity.server.name
    };
	}
  
  async addAccountCharacter(request: AddCharacterRequestDto, user: UserInfo): Promise<SessionCharacterDto> {
    try {
      const result = await this.connection.transaction(async em => {
        const userEntity = await em.getRepository(User).findOne({
          where: {
            id: user.id,
          },
          select: [ 'id' ]
        });

        if (!userEntity) {
          throw new ConflictException();
        }

        const character = await this.saveCharacterForUser(em, userEntity, request.lodestoneId);

        return {
          id: character.id,
          name: character.name,
          server: character.server.name,
          avatar: character.avatar,
          lodestoneId: character.lodestoneId,
          race: character.race,
          tribe: character.tribe,
          newsRole: character.newsRole,
          newsPseudonym: character.newsPseudonym,
          verified: false
        };
      });

      await this.publicAuthService.notifyUserChanged(user.id);
      return result;
    } catch (e) {
      if (isQueryFailedError(e)) {
        if (e.code === 'ER_DUP_ENTRY') {
          throw new ConflictException('This character has already been registered');
        }
      }

      // default
      throw e;
    }
  }

  // Utility methods


  // Also used in UserService
  async saveCharacterForUser(em: EntityManager, user: User, lodestoneId: number): Promise<Character> {
    const characterRepo = em.getRepository(Character);
    const otherCharacter = await characterRepo.findOne({
      where: {
        lodestoneId,
        active: true,
      },
      relations: [ 'user' ],
      select: [ 'id', 'name', 'user' ]
    });

    if (otherCharacter && otherCharacter.user.id !== user.id) {
        throw new ConflictException('This character is already claimed by another user');
    }

    const characterInfo = await this.lodestoneService.getCharacter(lodestoneId);

    if (!characterInfo) {
      throw new BadRequestException('Invalid character');
    }

    // Try two possible ways XIVAPI can return the data
    if (!SharedConstants.DATACENTERS.includes(characterInfo.DC))
    {
      throw new BadRequestException('This character is from the wrong datacenter');
    }

    if (otherCharacter && otherCharacter.name === characterInfo.Name) {
      throw new BadRequestException(
        'You have already registered this character. To update their Lodestone info, ' +
        'use the "Refresh from Lodestone" button in the character profile editor instead.');
    }

    // If we get here, either the Lodestone ID isn't registered yet,
    // or it is, but the character has a different name (indicating a name change).
    // We allow this: the user can make a new character profile for the new name.

    const server = await em.getRepository(Server).findOneBy({
      name: characterInfo.World,
    });

    if (!server) {
      throw new BadRequestException('Invalid server');
    }

    const race = getRaceByName(characterInfo.Race);

    if (!race) {
      throw new BadRequestException('Invalid race');
    }

    const tribe = getTribeByName(characterInfo.Tribe);

    if (!tribe) {
      throw new BadRequestException('Invalid tribe');
    }

    // Set all previously existing characters with this Lodestone ID as inactive
    await characterRepo.update({
      lodestoneId: lodestoneId,
      user,
      active: true,
    }, {
      active: null
    });

    return characterRepo.save({
      lodestoneId,
      name: characterInfo.Name,
      race,
      tribe,
      server,
      user,
      avatar: characterInfo.Avatar,
      verificationCode: generateVerificationCode(),
      active: true
    });
  }

  async getRegistrationStatus(name: string, lodestoneId: number, user?: UserInfo): Promise<CharacterRegistrationStatusResultDto> {
    const existingCharacter = await this.characterRepo.findOne({
      where: {
        lodestoneId,
        active: true,
      },
      relations: [ 'user' ],
      select: [ 'id', 'name', 'user' ]
    });

    let status: CharacterRegistrationStatus;

    if (!existingCharacter) {
      status = CharacterRegistrationStatus.UNCLAIMED;
    } else if (!user || existingCharacter.user.id !== user.id) {
      status = CharacterRegistrationStatus.CLAIMED_BY_ANOTHER_USER;
    } else if (existingCharacter.name !== name) {
      status = CharacterRegistrationStatus.RENAMED;
    } else {
      status = CharacterRegistrationStatus.ALREADY_REGISTERED;
    }

    return { status };
  }
}
