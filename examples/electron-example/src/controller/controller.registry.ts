import { registerControllers } from 'cec-client-server/decorator';
import { PathBrowserifyController } from './path-browserify.controller';
import { DialogController } from './dialog.controller';

registerControllers([PathBrowserifyController, DialogController]);
