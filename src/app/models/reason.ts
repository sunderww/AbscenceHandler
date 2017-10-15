import { Model, Column } from './orm/neorm';

export class Reason extends Model {

  @Column
  title:  string;

  constructor(title: string = '') {
    super();
    this.title = title;
  }
}
