import { Model, PrimaryColumn } from '../nedborm';

export class Teacher extends Model {

  @PrimaryColumn
  name:  string;

  constructor(name: string = '') {
    super();
    this.name = name;
  }
}
