import { Lesson } from './lesson';
import { Reason } from './reason';

export class Absence {
  lesson:     Lesson;
  reason:     Reason;
  justified:  boolean;
  caughtUp:   boolean;
  comments:   string;
}
