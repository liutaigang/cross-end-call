# Electron 进程间通信——基于 cec-client-server 实现

![](https://raw.githubusercontent.com/liutaigang/cross-end-call/main/examples/electron-example/docs/images/ipc-cec.png)

> 由于作者在实现 cec-client-server 的时候，并不知道 json-rpc 2.0 的这个协议。这个协议规范了 RPC 过程中的实施细则，所以，基于 json-rpc 2.0，重写了 cec-client-server，新的代码库见于：https://github.com/cross-end-call/jsonrpc-cec

## 简介

[cec-client-server](https://github.com/liutaigang/cross-end-call) 是一个用于实现“[远程过程调用](https://www.zhihu.com/search?q=远程过程调用&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra={"sourceType"%3A"answer"%2C"sourceId"%3A36197244})”的库，使用 TS 实现。

所谓的“远程过程调用”，简称 RPC，就是要像调用本地的函数一样去调“远程函数”。通俗的说：A、B 两个服务分别部署在不同的地方，A 可以像调用方法本地的函数一样去调用 B 声明好的函数。

[cec-client-server](https://github.com/liutaigang/cross-end-call) 使用 `调用/订阅` 的方式来实现 electron 进程间的通讯，其有以下优点：

- 全面：可实现 electron：`主进程 <—> 渲染进程`、`渲染进程 <—> 渲染进程`的通讯
- 实用：比 [`ipcRenderer.invoke`](https://www.electronjs.org/zh/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args) / [`ipcMain.handle`](https://www.electronjs.org/zh/docs/latest/api/ipc-main#ipcmainhandlechannel-listener) 的方式更强大
- 安全：[remote](https://github.com/electron/remote) 模块虽然功能强大，但是安全、性能是令人担忧的，cec-client-server 是基于 [`ipcMain.on`](https://www.electronjs.org/zh/docs/latest/api/ipc-main) / [`ipcRenderer.send`](https://www.electronjs.org/zh/docs/latest/api/ipc-renderer) ，安全有保证。**要注意的是**：这里仅比较两者在通讯方面的能力，cec-client-server 不具备代替 remote 的能力

项目地址：https://github.com/liutaigang/cross-end-call/tree/main/examples/electron-example

## 实现

[新建一个 electron 项目](https://www.electronjs.org/zh/docs/latest/tutorial/tutorial-first-app)，目录结构：

```
.
├── src
│   ├── main.ts
│   ├── preload.ts
│   └── renderer.ts
├── index.html
└── package.json
```

electron 的通讯模式是一对多的一个模型，即：当存在多窗口时，一个主程序需要和多个窗口通讯。但是使用 cec-client-server 时，每一对 CecServer 和 CecClient 都需要一个独立的信道。于是有了以下代码：

**[main.ts](https://github.com/liutaigang/cross-end-call/blob/main/examples/electron-example/src/main.ts)** 主要逻辑为：

1、创建一个新的窗口实例；

2、初始化 CecServer 实例；

如下：

```ts
import { join } from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { CecServer, MsgHandler } from 'cec-client-server';

const createWindow = () => {
  const mainWindow = new BrowserWindow({ webPreferences: { preload: join(__dirname, 'preload.js') }});
  mainWindow.loadFile(join(__dirname, '../index.html'));
  // 初始化 CecServer 实例，每一个 BrowserWindow 都需要一个自有的 CecServer 实例
  initCecServer(mainWindow);
};

app.whenReady().then(() => {
  createWindow();
});

function initCecServer({ webContents }: BrowserWindow) {
  // 发送/接收的消息的 channel 名称，需要保持唯一性，所以加上了 webContents.id
  // 每一对 CecServer 和 CecClient 都需要一个独立的信道，所以新创建一个 window 时，需要新建一个 CecServer, 并使用一个唯一的 channel name 来通讯
  const sendMessageToken = 'cec-channel:send-message-' + webContents.id;
  const receiveMessageToken = 'cec-channel:receive-messag-' + webContents.id;
  
  // 将两个 channel 的名称的同步给 preload.ts
  webContents.send('cec-channel:initial-message', { sendMessageToken, receiveMessageToken });

  // 实例化 CecServer: 使用唯一 channel name 建立信道, 实现 cecServer 和 cecClient 的通讯
  const msgSender = (value: any) => webContents.send(sendMessageToken, value);
  const msgReceiver = (msgHandler: MsgHandler) => ipcMain.on(receiveMessageToken, (_, value) => msgHandler(value));
  const cecServer = new CecServer(msgSender, msgReceiver);

  ...
}
```

**[preload.ts](https://github.com/liutaigang/cross-end-call/blob/main/examples/electron-example/src/preload.ts)** 主要逻辑：

```ts
import { MsgHandler } from 'cec-client-server';
import { contextBridge, ipcRenderer } from 'electron/renderer';

// 通过 contextBridge 暴露事件：electronMesssageAPI.onMessageReady 给 renderer.ts 暴露通讯能力：msgSender, msgReceiver
contextBridge.exposeInMainWorld('electronMesssageAPI', {
  onMessageReady: (callback: (arg: any) => void) => {
    ipcRenderer.on('cec-channel:initial-message', (_, value) => {
      // 每一对 CecServer 和 CecClient 都需要一个独立的信道，所以新建一个 window 时，需要使用一个唯一的 channel name 来建立信道
      const { sendMessageToken, receiveMessageToken } = value;
      const msgSender = (val: any) => ipcRenderer.send(receiveMessageToken, val);
      const msgReceiver = (msgHandler: MsgHandler) => ipcRenderer.on(sendMessageToken, (_, val) => msgHandler(val));
      // 将初始化 CecClient 所需的 msgSender, msgReceiver 传递到 renderer.ts 中
      callback({ msgSender, msgReceiver });
    });
  },
});

```

**[renderer.ts](https://github.com/liutaigang/cross-end-call/blob/main/examples/electron-example/src/renderer.ts)** 主要逻辑：

```ts
import { CecClient } from 'cec-client-server';

const electronMesssageAPI = (window as any).electronMesssageAPI;
electronMesssageAPI.onMessageReady(({ msgSender, msgReceiver }: any) => {
  // 实例化 CecClient，通过该实例，可以与对应的窗口的 CecServer 进行通信
  const cecClient = new CecClient(msgSender, msgReceiver);
  ...
});
```

## 总结

在 electron 中使用 cec-client-server，除了功能增强外，主进程和渲染进程组件之间的依赖关系也得以优化

cec-client-server 不依赖特定的信道，除了 ipc， scoket 等全双工的通信也是可选项