import { Model, Column } from '../nedborm';

export class Reason extends Model {
  @Column
  title:  string;
}
