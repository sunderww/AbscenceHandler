import * as path from 'path';
import { remote } from 'electron';

const app = remote.app;

/**
 * Gets a valid path in user data folder.
 * @param {...string[]} filePathElements Paths that must be added (variadic arg)
 * @return {string} A valid path for the host OS, prepended by the userData folder
 */
export function fileInUserPath(...filePathElements: string[]): string {
  return path.join(...[app.getPath('userData')].concat(filePathElements));
}
