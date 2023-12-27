import { CrossEndCall, MsgSender, MsgReceiver } from "@cec/core";

export type OnCallCancel = () => void;
export type OnSubscribeCancel = () => void;

export class CecServer {
  private crossEndCall: CrossEndCall;

  constructor(private msgSender: MsgSender, private msgReceiver: MsgReceiver) {
    this.crossEndCall = new CrossEndCall(this.msgSender, this.msgReceiver);
  }

  onCall(name: string, callHandler: (...args: any[]) => any): OnCallCancel {
    const reception = this.crossEndCall.reply(name, callHandler);
    return reception.cancelReply;
  }

  onSubscribe(
    name: string,
    subscribleHandler: (next: (value: any) => void) => OnSubscribeCancel
  ): OnSubscribeCancel {
    const next = (value: any) => {
      this.crossEndCall.call(name, value);
    };
    return subscribleHandler.call({}, next);
  }
}
