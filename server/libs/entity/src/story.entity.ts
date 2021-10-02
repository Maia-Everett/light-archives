import { StoryType } from '@app/shared/enums/story-type.enum';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { StoryTag } from './story-tag.entity';

@Entity()
export class Story extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Character, {
    nullable: false,
  })
  owner: Character;

  @Column({
    nullable: false,
  })
  title: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: ''
  })
  content: string;

  @Column({
    type: 'enum',
    enum: StoryType,
    nullable: false,
  })
  type: StoryType;

  @OneToMany(() => StoryTag, tag => tag.story, {
    cascade: [ 'insert', 'remove' ],
  })
	tags: StoryTag[]
}
