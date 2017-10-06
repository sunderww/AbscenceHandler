import { Injectable } from '@angular/core';
import { DatabaseConnection } from './db-connection';

@Injectable()
export class DBService {
  public connection: DatabaseConnection;

  public connect() {
    if (!this.connection) {
      this.connection = new DatabaseConnection();
    }
  }
}
