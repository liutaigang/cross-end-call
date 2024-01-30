import { callable, controller } from 'cec-client-server/decorator';
import { BrowserWindow, Dialog, MessageBoxOptions, MessageBoxReturnValue, dialog } from 'electron';

@controller('Dialog')
export class DialogController implements Pick<Dialog, 'showMessageBox' | 'showErrorBox'> {
  constructor() {}

  showMessageBox(browserWindow: BrowserWindow, options: MessageBoxOptions): Promise<MessageBoxReturnValue>;
  showMessageBox(options: MessageBoxOptions): Promise<MessageBoxReturnValue>;
  @callable()
  showMessageBox(browserWindow: unknown, options?: unknown): Promise<MessageBoxReturnValue> {
    return dialog.showMessageBox(browserWindow as any, options as any);
  }

  showErrorBox(title: string, content: string): void {
    return dialog.showErrorBox(title, content);
  }
}
