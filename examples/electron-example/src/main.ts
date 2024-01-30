import 'reflect-metadata';
import './controller/controller.registry';
import { join } from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { CecServer, MsgHandler } from 'cec-client-server';
import { getControllers } from 'cec-client-server/decorator';

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(join(__dirname, '../index.html'));
  initCecServer(mainWindow);
};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function initCecServer({ webContents }: BrowserWindow) {
  const sendMessageToken = 'cec-channel:send-message-' + webContents.id;
  const receiveMessageToken = 'cec-channel:receive-messag-' + webContents.id;
  webContents.send('cec-channel:initial-message', {
    sendMessageToken,
    receiveMessageToken,
  });

  const msgSender = (value: any) => webContents.send(sendMessageToken, value);
  const msgReceiver = (msgHandler: MsgHandler) => ipcMain.on(receiveMessageToken, (_, value) => msgHandler(value));
  const cecServer = new CecServer(msgSender, msgReceiver);

  // 注册
  const { callables, subscribables } = getControllers();
  Object.entries(callables).forEach((item) => cecServer.onCall(...item));
  Object.entries(subscribables).forEach((item) => cecServer.onSubscribe(...item));
}
