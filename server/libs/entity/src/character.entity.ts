import { Race } from '@app/shared/enums/race.enum';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Server } from './server.entity';
import { User } from './user.entity';

@Entity()
export class Character extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  lodestoneId: number;

  @Column({
    nullable: false,
  })
  name: string;

  @Column({
    type: 'enum',
    enum: Race,
    nullable: false,
  })
  race: Race;

  @Column({
    nullable: false,
  })
  avatar: string;

  @Column({
    nullable: true
  })
  verifiedAt: Date;

  @Column({
    type: 'text',
    nullable: true
  })
  verificationCode: string | null;

  @ManyToOne(() => Server, {
    nullable: false,
  })
  server: Server;

  @ManyToOne(() => User, {
    nullable: false,
  })
  user: User;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: ''
  })
  appearance: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: ''
  })
	background: string;

  @Column({
    nullable: false,
    default: ''
  })
	occupation: string;

  @Column({
    nullable: false,
    default: ''
  })
	age: string;

  @Column({
    nullable: false,
    default: ''
  })
	birthplace: string;

  @Column({
    nullable: false,
    default: ''
  })
	residence: string;

  @Column({
    nullable: false,
    default: ''
  })
	title: string;

  @Column({
    nullable: false,
    default: ''
  })
	nickname: string;

  @Column({
    nullable: false,
    default: ''
  })
	motto: string;

  @Column({
    nullable: false,
    default: ''
  })
	loves: string;

  @Column({
    nullable: false,
    default: ''
  })
	hates: string;

  @Column({
    nullable: false,
    default: ''
  })
	motivation: string;

  @Column({
    nullable: false,
    width: 100,
    default: ''
  })
	carrdProfile: string;
}
