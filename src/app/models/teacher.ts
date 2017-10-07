import { Model, Column } from './orm/neorm';

export class Teacher extends Model {

  @Column
  name:  string;

  constructor(name: string = '') {
    super();
    this.name = name;
  }
}
