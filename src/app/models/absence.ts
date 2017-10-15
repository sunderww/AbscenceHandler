import { Lesson } from './lesson';
import { Reason } from './reason';
import { Model, Column, Relation, ERelationType } from './orm/neorm';

export class Absence extends Model {

  @Relation({ type: ERelationType.ONE_TO_ONE, dest: Lesson })
  lesson:     Lesson;

  @Relation({ type: ERelationType.ONE_TO_ONE, dest: Reason })
  reason:     Reason;

  @Column
  justified:  boolean;

  @Column
  caughtUp:   boolean;

  @Column
  comments:   string;
}
