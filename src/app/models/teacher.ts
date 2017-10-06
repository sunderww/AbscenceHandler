import { Entity, PrimaryColumn, BaseEntity } from "typeorm";

@Entity()
export class Teacher extends BaseEntity {

  @PrimaryColumn()
  name:  string;

}
