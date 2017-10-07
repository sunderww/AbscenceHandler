import { Model }  from './core';

/**
 *
 */
export function Column(target: any, key: string) {
  // Throw an error if the target does not inherit from Model
  if (!(target instanceof Model)) {
    throw new Error("Column must be applied on a class that inherits Model");
  }

  (<typeof Model>target.constructor)._addColumn(key);
}

/**
 *
 */
export function PrimaryColumn(target: any, key: string) {
  // Throw an error if the target does not inherit from Model
  if (!(target.constructor.prototype instanceof Model)) {
    throw new Error("Column must be applied on a class that inherits Model");
  }

  (<typeof Model>target.constructor)._addColumn(key, true);
}
