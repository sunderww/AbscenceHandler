import * as DataStore from 'nedb';
import * as path from 'path';
import { remote } from 'electron';

const app = remote.app;

interface NEORMMetadata {
   primaryKey ?: string;
   keys       : string[];
}


/**
 * All entities must inherit from Model in order to be saved persistently.
 * Use the @Column decorator in order to add a field to the database.
 * The @PrimaryColumn decorator can be used to specify that a field is a primary
 * key. By default, neDB will create a 16 characters alphanumerical id.
 */
export class Model {

  /**
   * The metadata of the model that will allow to know which properties will
   * be stored inside the database.
  */
  private static _metadata: NEORMMetadata = { keys: [] };
  private static _getMetadata(): NEORMMetadata {
    return this._metadata;
  }
  /** A non-static helper to access the static _metadata member */
  protected metadata(): NEORMMetadata {
    return (<typeof Model>this.constructor)._getMetadata();
  }

  /**
   * The actual neDB DataStore object.
   * See https://github.com/louischatriot/nedb for more information on its
   * capabilities, in case some features are missing here.
   */
  private static _db: DataStore;
  protected static _getDB(): DataStore {
    if (!this._db) {
      const filename = path.join(app.getPath('userData'), this.constructor.name + '.db');
      this._db = new DataStore({
        filename: filename,
        autoload: true,
      });
    }

    return this._db;
  }
  /** A non-static helper to access the static _db member */
  protected db(): DataStore {
    return (<typeof Model>this.constructor)._getDB();
  }

  /** The neDB _id of the object. Null if not saved to neDB */
  private _id: string;

  /**
   * Save the model to the database
   * @return {Promise<object>} A promise that resolves with the new created object
   */
  public async save(): Promise<Model> {
    return new Promise<Model>((resolve, reject) => {
      this.db().insert(this.getDBDocument(), (error, newDoc) => {
        if (error) {
          reject(error);
        } else {
          this.updateDocument(newDoc);
          resolve(this);
        }
      });
    });
  }

  /**
   *
   */
  public static async find(data: object): Promise<Model[]> {
    const metadata = this._getMetadata();
    return new Promise<Model[]>((resolve, reject) => {
      // I must have a static DB :(
      resolve([]);
    });
  }

  /** Returns the internal _id of the entity */
  public getID(): string {
    return this._id;
  }

  /**
   * Generates the data that will be stored in the database using metadata.
   * @return {object} The document that will be stored inside neDB.
   */
  protected getDBDocument(): object {
    let document = {};
    const cls = <typeof Model>this.constructor;
    const metadata = this.metadata();

    if (metadata.primaryKey) {
      document['_id'] = this[metadata.primaryKey];
    }
    for (let key of metadata.keys) {
      document[key] = this[key];
    }

    return document;
  }

  /** Updates the columns to reflect the newDocument object, and set the _id correctly */
  protected updateDocument(newDocument: object) {
    this._id = newDocument['_id'];

    // Reset the fields of the object in case neDB changed anything.
    // Normally, nothing should change, but it is better to see if neDB changed
    // some values inside instead of having different data inside the db and
    // inside the model.
    let metadata = this.metadata();
    if (metadata.primaryKey) {
      this[metadata.primaryKey] = newDocument['_id'];
    }

    for (let key of metadata.keys) {
      this[key] = newDocument[key];
    }
  }


  /**
   * Returns the metadata associated with the class.
   * @param {boolean} create: if the metadata does not exist and create is true,
   * a default object will be created (no keys, no primarykey).
   * @return {NEORMMetadata} the metadata
   */
  protected static getMetadata(create: boolean = false): NEORMMetadata {
    if (create && !this._metadata[this.name]) {
      this._metadata[this.name] = { keys: [] };
    }
    return this._metadata[this.name];
  }


  public static _addColumn(key: string, primary: boolean = false) {
    let metadata = this.getMetadata(true);

    if (primary) {
      metadata.primaryKey = key;
    } else {
      metadata.keys.push(key);
    }
  }

}

export function Column(target: any, key: string) {
  // Throw an error if the target does not inherit from Model
  if (!(target instanceof Model)) {
    throw new Error("Column must be applied on a class that inherits Model");
  }

  (<typeof Model>target.constructor)._addColumn(key);
}

export function PrimaryColumn(target: any, key: string) {
  // Throw an error if the target does not inherit from Model
  if (!(target.constructor.prototype instanceof Model)) {
    throw new Error("Column must be applied on a class that inherits Model");
  }

  (<typeof Model>target.constructor)._addColumn(key, true);
}
