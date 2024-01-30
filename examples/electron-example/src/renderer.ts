import { CecClient } from 'cec-client-server';

const electronMesssageAPI = (window as any).electronMesssageAPI;
electronMesssageAPI.onMessageReady(({ msgSender, msgReceiver }: any) => {
  const btn = document.getElementById('file-select-btn');
  const textAreaContent = document.getElementById('text-area-content');
  const textAreaStat = document.getElementById('text-area-stat');
  const messageBtn = document.getElementById('message-btn');

  const cecClient = new CecClient(msgSender, msgReceiver);
  let cancelSubscrible = () => {};
  let filename = '';
  btn.onclick = async () => {
    filename = await cecClient.call('PathBrowserify.selectPath');
    const fileContent = await cecClient.call('PathBrowserify.readFile', filename, { encoding: 'utf8' });
    textAreaContent.innerText = fileContent;

    cancelSubscrible();
    cancelSubscrible = cecClient.subscrible(
      'PathBrowserify.watchFile',
      (value) => {
        textAreaStat.innerText = JSON.stringify(value);
      },
      filename,
    );
  };

  messageBtn.onclick = () => {
    cecClient.call('Dialog.showMessageBox', { message: filename || 'Hello Electron !' });
  };
});
