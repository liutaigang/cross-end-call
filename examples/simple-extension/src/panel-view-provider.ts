import {
  ExtensionContext,
  Uri,
  Webview,
  WebviewPanel,
  WebviewView,
  WebviewViewProvider,
} from "vscode";
import { readFileSync } from "fs";
import { join } from "path";
import { CallHandler, CecServer, SubscribleHandler } from "cec-client-server";
import { modifyHtml } from "html-modifier";

export type ControllerOptions = {
  callables: { [name: string]: CallHandler };
  subscribables: { [name: string]: SubscribleHandler };
};

export class PanelViewProvider implements WebviewViewProvider {
  // 这个是在前端应用插入代码的标识，用于在 index.html 文件适应的位置插入内容
  static WEBVIEW_INJECT_IN_MARK = "__webview_public_path__";
  static WEBVIEW_DIST_DIR = "out/view-vue";
  static WEBVIEW_INDEX_PATH = "out/view-vue/index.html";

  /**
   * 构造方法
   * @param context 该插件的上下文，在插件激活时可以获取
   * @param controllerOptions
   */
  constructor(
    protected context: ExtensionContext,
    protected controllerOptions: ControllerOptions
  ) {}

  /**
   * 用于实现 webviewView 的处理逻辑，例如：html 赋值、通讯、设置 webviewView 参数等
   * @param webviewView 可以为 vscode.WebviewView 或者 vscode.WebviewPanel 的实例
   */
  async resolveWebviewView(webviewView: WebviewView | WebviewPanel) {
    const { webview } = webviewView;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    const cecServer = new CecServer(
      webview.postMessage.bind(webview),
      webview.onDidReceiveMessage.bind(webview)
    );
    const { callables, subscribables } = this.controllerOptions;
    Object.entries(callables).map((item) => cecServer.onCall(...item));
    Object.entries(subscribables).map((item) => cecServer.onSubscribe(...item));

    webview.html = await this.getWebviewHtml(webview);
  }

  /**
   * 处理前端应用 index.html 文件的方法
   * @param webview vscode.Webview 类型，指向 vscode.WebviewView 的一个属性：webview
   * @returns 处理好的 index.html 文本内容
   */
  protected async getWebviewHtml(webview: Webview) {
    const webviewUri = webview
      .asWebviewUri(
        Uri.joinPath(
          this.context.extensionUri,
          PanelViewProvider.WEBVIEW_DIST_DIR
        )
      )
      .toString();

    // 需要在前端应用中插入的脚本，目的是：将上述 webviewUri 所指的目录告知前端应用，前端应用在定位资源时需要
    const injectInContent = `<script> window.${PanelViewProvider.WEBVIEW_INJECT_IN_MARK} = "${webviewUri}"</script>`;

    const htmlPath = join(
      this.context.extensionPath,
      PanelViewProvider.WEBVIEW_INDEX_PATH
    );
    const htmlText = readFileSync(htmlPath).toString();
    return await modifyHtml(htmlText, {
      onopentag(name, attribs) {
        if (name === "script") attribs.src = join(webviewUri, attribs.src);
        if (name === "link") attribs.href = join(webviewUri, attribs.href);
        return { name, attribs };
      },
      oncomment(data) {
        const hasMark = data
          ?.toString()
          .toLowerCase()
          .includes(PanelViewProvider.WEBVIEW_INJECT_IN_MARK);
        return hasMark
          ? { data: injectInContent, clearComment: true }
          : { data };
      },
    });
  }
}
