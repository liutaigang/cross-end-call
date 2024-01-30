import { MsgHandler } from 'cec-client-server';
import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld('electronMesssageAPI', {
  onMessageReady: (callback: (arg: any) => void) => {
    ipcRenderer.on('cec-channel:initial-message', (_, value) => {
      const { sendMessageToken, receiveMessageToken } = value;
      const msgSender = (val: any) => ipcRenderer.send(receiveMessageToken, val);
      const msgReceiver = (msgHandler: MsgHandler) => ipcRenderer.on(sendMessageToken, (_, val) => msgHandler(val));
      callback({ msgSender, msgReceiver });
    });
  },
});
