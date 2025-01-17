
import { Character, Event, EventAnnouncement, EventLocation, FreeCompany, Image, Location, LocationWeather, News, NewsCategory, NewsIssue, NoticeboardItem, Server, Story, StoryTag, User, Venue, Violation, WikiPage, Weather } from '@app/entity';
import { CommunityMembership } from '@app/entity/community-membership.entity';
import { CommunityTag } from '@app/entity/community-tag.entity';
import { Community } from '@app/entity/community.entity';
import { VenueTag } from '@app/entity/venue-tag.entity';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import config from 'config';
import { DbConfigInterface } from './interfaces/db-config.interface';

const dbConfig = config.get<DbConfigInterface>('db');

export const dbConfiguration: TypeOrmModuleOptions = {
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  timezone: 'Z',
  entities: [
    Character,
    Community,
    CommunityMembership,
    CommunityTag,
    ContentNote,
    Event,
    EventAnnouncement,
    EventLocation,
    FreeCompany,
    Image,
    Location,
    LocationWeather,
    News,
    NewsCategory,
    NewsIssue,
    NoticeboardItem,
    Server,
    Story,
    StoryTag,
    User,
    Venue,
    VenueTag,
    Violation,
    WikiPage,
    Weather,
  ],
  synchronize: dbConfig.synchronize,
  logging: dbConfig.logging,
  keepConnectionAlive: true,
};

Object.assign(dbConfiguration, { type: dbConfig.type });
