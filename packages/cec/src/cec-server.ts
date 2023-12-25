import { ReplyReception, CrossEndCall } from "@cec/core";

export type CallableCancel = () => void;
export type SubscribableCancall = () => void;

export class CecServer {
  private replyReceptionMap = new Map<string, ReplyReception>();
  constructor(private cec: CrossEndCall) {}
  addCallable(name: string, callHandler: (args: any) => any) {
    const reception = this.cec.reply(name, callHandler);
    this.replyReceptionMap.set(name, reception);
  }

  addSubscribable(name: string, next: (...args: any[]) => void) {}
}
