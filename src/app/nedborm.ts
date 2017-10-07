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
  private static _metadata: NEORMMetadata;
  private static _getMetadata(): NEORMMetadata {
    // NOTE: you CAN'T initialize _metadata on declaration as it would be
    // shared between all inherited classes
    if (!this._metadata) {
      this._metadata = { keys: [] };
    }

    return this._metadata;
  }
  /** A non-static helper to access the static _metadata member */
  private metadata(): NEORMMetadata {
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
      const filename = path.join(app.getPath('userData'), this.name + '.db');
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
   * Constructs a model from a document coming from the DB. Basically Just
   * sets the primary key correctly and the internal _id.
   * @return {Model} the newly created object
   */
   protected static fromDocument(document: object): Model {
     let obj = new this();
     obj.updateDocument(document);
     return obj;
   }

  /**
   * Save the model to the database. If the models already exists in database,
   * it will instead call update.
   * @return {Promise<object>} A promise that resolves with the updated object
   * (contains the _id).
   */
  public async save(): Promise<Model> {
    if (this._id) return this.update();

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
   * Updates the document to the database. The _id flag must be set otherwise
   * it will return an error.
   * @return {Promise<Model>} this object.
   */
  public async update(): Promise<Model> {
    return new Promise<Model>((resolve, reject) => {
      if (!this._id) return reject(new Error('update must be called on an object already saved in the DB'));

      this.db().update({ _id: this._id }, this.getDBDocument(), {}, (error, _) => {
        if (error) {
          reject(error);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * Just a wrapper for neDB find method.
   * See https://github.com/louischatriot/nedb for more information
   * @return {Promise<Model[]>} A promise that resolves with all found objects
   */
  public static async find(data: object): Promise<Model[]> {
    // First replace the primaryKey with _id in case the user uses a custom
    // primary key.
    const primaryKey = this._getMetadata().primaryKey;
    if (primaryKey && primaryKey in data) {
      data['_id'] = data[primaryKey];
      delete data[primaryKey];
    }

    return new Promise<Model[]>((resolve, reject) => {
      this._getDB().find(data, (error, documents) => {
        if (error) {
          reject(error);
        } else {
          // Map document objects to models
          resolve(documents.map(d => this.fromDocument(d)));
        }
      });
    });
  }

  /** Returns the model with a given _id */
  public static async findByID(id: string): Promise<Model> {
    return new Promise<Model>((resolve, reject) => {
      this.find({ _id: id }).then(models => {
        if (models.length) resolve(models[0]);
        else resolve(null);
      }).catch(error => {
        reject(error);
      });
    });
  }

  /** Returns all models from the db */
  public static async all(): Promise<Model[]> {
    return this.find({});
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

    // Reset the fields of the object in case neDB changed anything, or to
    // initialize when constructing a model from a DB document.
    let metadata = this.metadata();
    if (metadata.primaryKey) {
      this[metadata.primaryKey] = newDocument['_id'];
    }

    for (let key of metadata.keys) {
      this[key] = newDocument[key];
    }
  }


  public static _addColumn(key: string, primary: boolean = false) {
    let metadata = this._getMetadata();

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
