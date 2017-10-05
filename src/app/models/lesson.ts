import { Teacher }  from './teacher';
import { id }       from './id';

export enum LessonType {
  LECTURE = 1,
  LAB,
  OTHER
}

export class Lesson {
  id:         id;
  type:       LessonType;
  number:     number;
  teacher:    Teacher;
  comments:   string;
  startTime:  number;
  endTime:    number;
}
