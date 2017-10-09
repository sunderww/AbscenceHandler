import * as DataStore     from 'nedb';
import { fileInUserPath } from './util';

interface IMetadata {
   primaryKey ?: string;
   keys       : string[];
   relations  : IRelationMetadata[];
}


/**
 * All entities must inherit from Model in order to be saved persistently.
 * Use the @Column decorator in order to add a field to the database.
 * The @PrimaryColumn decorator can be used to specify that a field is a primary
 * key. By default, neDB will create a 16 characters alphanumerical id.
 * Note that the column names shouldn't start with '_' as it is reserved for
 * internal use only.
 */
export class Model {

  /**
   * The metadata of the model that will allow to know which properties will
   * be stored inside the database.
  */
  private static _metadata: IMetadata;
  public static _getMetadata(): IMetadata {
    // NOTE: you CAN'T initialize _metadata on declaration as it would be
    // shared between all inherited classes
    if (!this._metadata) {
      this._metadata = { keys: [], relations: [] };
    }

    return this._metadata;
  }
  /** A non-static helper to access the static _metadata member */
  private metadata(): IMetadata {
    return (<typeof Model>this.constructor)._getMetadata();
  }

  /**
   * The actual neDB DataStore object.
   * See https://github.com/louischatriot/nedb for more information on its
   * capabilities, in case some features are missing here.
   */
  private static _db: DataStore;
  public static _getDB(): DataStore {
    if (!this._db) {
      const filename = fileInUserPath(this.name + '.db');
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
   protected static async fromDocument(document: object): Promise<Model> {
     return new Promise<Model>(async (resolve, reject) => {
       let obj = new this();
       await obj.updateFromDocument(document);
       resolve(obj);
     });
   }

  /**
   * Saves the model's relationships of a given type to the database. If they
   * already exist in the database, it won't do anything.
   * @param {ERelationType[]} types The types of relations that should be saved
   * @param {Model} except To avoid cyclic calls to save, don't save the "parent"
   * @return {Promise<any>} A promise that resolves when the relations are saved
   */
  private async saveRelations(types: ERelationType[], except?: Model): Promise<any> {
    let promises: Promise<any>[] = []

    for (let rel of this.metadata().relations) {
      if (types.indexOf(rel.options.type) > -1) {
        const relModel: Model = this[rel.name];

        if (relModel && relModel != except && !relModel._id)
          promises.push(relModel._save(this));
      }
    }

    return Promise.all(promises);
  }

  /**
   * Does the actual save. The user doesn't need to see the internal caller
   * parameter, so it has to be a separate function.
   * @param {Model} caller (optional) Give the caller as a parameter to avoid
   * cyclic reference.
   * @return {Promise<object>} A promise that resolves with the updated object.
   */
  private async _save(caller ?: Model): Promise<Model> {
    return new Promise<Model>((resolve, reject) => {
      const toSave = [ERelationType.ONE_TO_ONE, ERelationType.MANY_TO_ONE]
      this.saveRelations(toSave, caller).then(() => {
        this.db().insert(this.getDBDocument(), (error, newDoc) => {
          if (error) {
            reject(error);
          } else {
            this.saveRelations([ERelationType.ONE_TO_MANY], caller).then( () => {
              return this.updateFromDocument(newDoc);
            }).then(() => {
              resolve(this);
            });
          }
        });
      });
    });
  }

  /**
   * Save the model to the database. If the models already exists in database,
   * it will instead call update.
   * If the model has relationships to object that has not been saved, it will
   * save them in order to get their _id.
   * @return {Promise<object>} A promise that resolves with the updated object
   * (contains the _id).
   */
  public async save(): Promise<Model> {
    if (this._id) return this.update();

    return this._save();
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
      this._getDB().find(data, async (error, documents) => {
        if (error) {
          reject(error);
        } else {
          // Transform document objects to models
          let models = []
          for (let d of documents) {
            models.push(await this.fromDocument(d));
          }
          resolve(models);
        }
      });
    });
  }

  /** Returns the model with a given _id */
  public static async findByID(id: string): Promise<Model> {
    const models = await this.find({ _id: id });
    return models.length ? models[0] : null;
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
   * Generates the data that will be stored in the database for the relationships
   * @return {object} The relation data that can be safely put in _rel object
   */
   private getRelationDBDocument(): object {
     const metadata = this.metadata();
     let obj = {};

     for (let rel of metadata.relations) {

       // One to many relationships are stored on the other side
      const types = [ERelationType.ONE_TO_ONE, ERelationType.MANY_TO_ONE];
       if (types.indexOf(rel.options.type) > -1) {
         const relModel: Model = this[rel.name];
         obj[rel.name] = relModel ? relModel._id : "undefined";
       }
     }

     return obj;
   }

  /**
   * Generates the data that will be stored in the database using metadata.
   * @return {object} The document that will be stored inside neDB.
   */
  public getDBDocument(): object {
    const metadata = this.metadata();
    let document = {};

    if (metadata.primaryKey) {
      document['_id'] = this[metadata.primaryKey];
    } else if (this._id) {
      document['_id'] = this._id;
    }
    for (let key of metadata.keys) {
      document[key] = this[key];
    }
    document['_rel'] = this.getRelationDBDocument();

    return document;
  }

  /** Updates the columns to reflect the newDocument object, and set the _id correctly */
  protected async updateFromDocument(newDocument: object) {
    this._id = newDocument['_id'];

    console.log('updateFromDocument');
    console.log(newDocument);

    // Reset the fields of the object in case neDB changed anything, or to
    // initialize when constructing a model from a DB document.
    let metadata = this.metadata();
    if (metadata.primaryKey) {
      this[metadata.primaryKey] = newDocument['_id'];
    }

    for (let key of metadata.keys) {
      this[key] = newDocument[key];
    }

    // Set relation objects
    for (let rel of metadata.relations) {
      const cls = <typeof Model>rel.options.dest;

      // One to many case : an array of objects
      if (rel.options.type == ERelationType.ONE_TO_MANY) {
        const key = `_rel.${rel.options.backref}`;
        this[rel.name] = await cls.find( { key: this._id });
      } else if (rel.name in newDocument['_rel']) {
        // Other cases if the relation is set

        const id = newDocument['_rel'][rel.name];
        this[rel.name] = await cls.findByID(id);
      }
    }
  }

  /**
   * Deletes the document from the database. Does nothing if the document hasn't
   * already been saved.
   * @return {Promise<boolean>} true if the object has been deleted, false if it
   * wasn't already saved, and an error will be thrown if something goes wrong
   */
  public async delete(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!this._id) return resolve(false);

      this.db().remove({ _id: this._id }, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve(numRemoved > 0);
        }
      });
    });
  }

  /**
   * Method used by decorators to set metadata correctly.
   */
  public static _addColumn(key: string, options?: IColumnMetadataOptions) {
    let metadata = this._getMetadata();

    if (options && options.primary) {
      metadata.primaryKey = key;
    } else if (options && options.relation) {
      metadata.relations.push({
        name: key,
        options: options.relation
      });

      if (options.relation.type == ERelationType.ONE_TO_MANY) {
        // TODO: add the backref
      }
    } else {
      metadata.keys.push(key);
    }
  }

}


/**
 * Defines the type of relationship between two models
 */
export enum ERelationType {
  ONE_TO_ONE = 1,   // Object has a foreign id
  MANY_TO_ONE,      // Object has a foreign id
  ONE_TO_MANY,      // Foreign object has this object's id
}

/**
 * This interface defines the options of a relationship between models.
 * This is what the user will give as parameters to a relation decorator.
 * type
 */
export interface IRelationOptions {
  /** The type of relation it is */
  type      : ERelationType;

  /** The destination object's Typescript type */
  dest      : typeof Model;

  /** If the destination object should be deleted when the model is deleted */
  cascade  ?: boolean;

  /**
   * The name of the reference on the destination object, if the relation type
   * is one to many
   */
  backref  ?: string;
}

/**
 * This interface defines the metadata necessary for relationships. It should
 * only be for internal use.
 */
export interface IRelationMetadata {
  options: IRelationOptions;
  name: string;
}

/**
 * Defines the options that can be given to the _addColumn function
 */
export interface IColumnMetadataOptions {
  primary   ?: boolean;
  relation  ?: IRelationOptions;
}
