import { Model, IRelationOptions, IColumnMetadataOptions }  from './core';

/**
 * The function that does the actual add column call
 */
function addColumn(target: any, key: string, options: IColumnMetadataOptions) {
  // Throw an error if the target does not inherit from Model
  if (!(target instanceof Model)) {
    throw new Error("Column must be applied on a class that inherits Model");
  }

  // Check that the named is not reserved (starts with a _)
  if (key.startsWith('_')) {
    throw new Error("Column names shouldn't start with _ as it is reserved for internal use");
  }

  (<typeof Model>target.constructor)._addColumn(key, options);
}

/**
 * Defines a member variable as a column that will be saved in the database.
 * The native types are String, Number, Boolean, Date and null. You can also
 * use arrays and subdocuments (objects). If a field is undefined, it will not
 * be saved. Also, field names cannot begin by '$'.
 */
export function Column(target: any, key: string) {
  addColumn(target, key, {});
}

/**
 * Defines a member variable that will act as a primary key inside the database.
 * You must use one of the native type: String, Number or Date.
 */
export function PrimaryColumn(target: any, key: string) {
  addColumn(target, key, { primary: true });
}


/**
 * Defines a relationship with another Model. You must specify the destination
 * model and the relationship type.
 * One to many relationships must declare a backref.
 * Note that all modifications will be saved in cascade in the other model.
 */
export function Relation(options: IRelationOptions) {
  return (target: any, key: string) => {
    // Check that the destination is a class that inherits from model
    if (!(options.dest.prototype instanceof Model)) {
      throw new Error("Relation must be applied on a member that inherits Model");
    }

    addColumn(target, key, { relation: options });
  }
}
