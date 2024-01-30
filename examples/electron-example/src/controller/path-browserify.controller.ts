import { readFile, watchFile, WatchFileOptions, Stats } from 'fs';
import { callable, controller, subscribable } from 'cec-client-server/decorator';
import { dialog } from 'electron';
import { Deferred } from '../util/deferred';

@controller('PathBrowserify')
export class PathBrowserifyController {
  constructor() {}

  @callable()
  async selectPath() {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] });
    if (!canceled) {
      return filePaths[0];
    }
  }

  @callable()
  readFile(filename: string, options: { encoding?: null; flag?: string } = {}) {
    const { promise, resolve, reject } = new Deferred<Buffer>();
    readFile(filename, options, (err, data) => {
      err ? reject(err) : resolve(data);
    });
    return promise;
  }

  @subscribable()
  watchFile(next: (value: any) => void, filename: string, options: WatchFileOptions & { bigint?: false } = {}) {
    const statsListener = (curr: Stats, prev: Stats) => {
      next({ curr, prev });
    };
    const watcher = watchFile(filename, options, statsListener);
    return () => {
      watcher.removeAllListeners();
    };
  }
}
