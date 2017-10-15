import { Teacher }  from './teacher';
import { id }       from './id';
import { Model, Column, Relation, ERelationType } from './orm/neorm';

export enum LessonType {
  LECTURE = 1,
  LAB,
  OTHER
}

export class Lesson extends Model {
  id:         id;

  @Relation({ type: ERelationType.ONE_TO_ONE, dest: Lesson })
  type:       LessonType;

  @Column
  number:     number;

  @Relation({ type: ERelationType.ONE_TO_ONE, dest: Lesson })
  teacher:    Teacher;

  @Column
  comments:   string;

  @Column
  startTime:  number;

  @Column
  endTime:    number;
}
