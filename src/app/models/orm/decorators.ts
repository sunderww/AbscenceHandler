import { Model, IRelationOptions }  from './core';

/**
 * Defines a member variable as a column that will be saved in the database.
 * The native types are String, Number, Boolean, Date and null. You can also
 * use arrays and subdocuments (objects). If a field is undefined, it will not
 * be saved. Also, field names cannot begin by '$'.
 */
export function Column(target: any, key: string) {
  // Throw an error if the target does not inherit from Model
  if (!(target instanceof Model)) {
    throw new Error("Column must be applied on a class that inherits Model");
  }

  (<typeof Model>target.constructor)._addColumn(key);
}

/**
 * Defines a member variable that will act as a primary key inside the database.
 * You must use one of the native type: String, Number or Date.
 */
export function PrimaryColumn(target: any, key: string) {
  // Throw an error if the target does not inherit from Model
  if (!(target.constructor.prototype instanceof Model)) {
    throw new Error("Column must be applied on a class that inherits Model");
  }

  (<typeof Model>target.constructor)._addColumn(key, { primary: true });
}


/**
 * Defines a relationship with another Model. You must specify the destination
 * model and the relationship type.
 * Note that all modifications will be saved in cascade in the other model.
 */
export function Relation(options: IRelationOptions) {
  console.log('RELATIONSHIP OPTIONS :')
  console.log(options)
  return (target: any, key: string) => {
    // Throw an error if the target does not inherit from Model
    if (!(target.constructor.prototype instanceof Model)) {
      throw new Error("Column must be applied on a class that inherits Model");
    }

    (<typeof Model>target.constructor)._addColumn(key, { relation: options });
  }
}
