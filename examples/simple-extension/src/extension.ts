import { ExtensionContext, window } from "vscode";
import { PanelViewProvider } from "./panel-view-provider";
import { callables } from "./callables";

export function activate(context: ExtensionContext) {
  const viewProvidersidebar = new PanelViewProvider(context, {
    callables,
    subscribables: {},
  });
  // 在 views（ sidebar-view-container 已在 package.json 的 contributes 中声明）中注册
  const sidebarViewDisposable = window.registerWebviewViewProvider(
    "sidebar-view-container",
    viewProvidersidebar,
    { webviewOptions: { retainContextWhenHidden: true } }
  );

  context.subscriptions.push(sidebarViewDisposable);
}

export function deactivate() {}
