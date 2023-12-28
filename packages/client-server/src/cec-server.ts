import { CrossEndCall, MsgSender, MsgReceiver, CallHandler } from "cec-core";

export type OnCallCancel = () => void;
export type OnSubscribeCancel = () => void;
export type SubscribleHandler = (
  next: (value: any) => void
) => OnSubscribeCancel;

export class CecServer {
  private crossEndCall: CrossEndCall;

  constructor(private msgSender: MsgSender, private msgReceiver: MsgReceiver) {
    this.crossEndCall = new CrossEndCall(this.msgSender, this.msgReceiver);
  }

  onCall(name: string, callHandler: CallHandler): OnCallCancel {
    const reception = this.crossEndCall.reply(name, callHandler);
    return reception.cancelReply;
  }

  onSubscribe(
    name: string,
    subscribleHandler: SubscribleHandler
  ): OnSubscribeCancel {
    const next = (value: any) => {
      this.crossEndCall.call(name, value);
    };
    return subscribleHandler.call({}, next);
  }
}
