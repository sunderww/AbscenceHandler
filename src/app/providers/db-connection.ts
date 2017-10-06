import "reflect-metadata";
import { createConnection, Connection } from "typeorm";

export class DatabaseConnection {
  public ready: boolean = false;
  private conn: Connection;

  constructor()  {
    createConnection({
        type: "sqlite",
        database: "AbsenceHandler.db",
        entities: [
            "src/app/models/**/*.ts"
        ],
        synchronize: true,
        logging: false
    }).then(connection => {
        console.log("DONE connecting!");
        this.conn = connection;
        this.ready = true;
    }).catch(error => console.error("CONNECTION ERROR # "+ error));
  }
}
