import * as path from 'path';
import { remote } from 'electron';

const app = remote.app;

/**
 *
 */
export function fileInUserPath(...filePathElements: string[]): string {
  return path.join(...[app.getPath('userData')].concat(filePathElements));
}
