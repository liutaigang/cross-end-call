import { CrossEndCall, MsgSender, MsgReceiver, CallHandler } from "cec-core";
import { uuid } from "./util/uuid";

export type OnCallCancel = () => void;
export type OnSubscribeCancel = () => void;
export type SubscribleHandler = (
  next: (value: any) => void,
  ...args: any[]
) => OnSubscribeCancel;

export class CecServer {
  static CALL_MSG_CACHE_DELAY = 32;
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
    const onSubscribeCancelList: OnSubscribeCancel[] = [];
    const callMsgCache = new Set<any>();
    let callMsgCacheTimer: any = -1;

    const callHandler: CallHandler = (args: any[]) => {
      const subscribeId = uuid();

      const next = async (subscribeValue: any) => {
        callMsgCache.add({ subscribeId, subscribeValue });

        clearTimeout(callMsgCacheTimer);
        callMsgCacheTimer = setTimeout(() => {
          this.crossEndCall.call(name, Array.from(callMsgCache));
          callMsgCache.clear();
        }, CecServer.CALL_MSG_CACHE_DELAY);
      };

      const onSubscribeCancel = subscribleHandler.call({}, next, ...args);
      onSubscribeCancelList.push(onSubscribeCancel);
      return subscribeId;
    };

    const forSubscrible = `${name}.forSubscrible`;
    const reception = this.crossEndCall.reply(forSubscrible, callHandler);

    return () => {
      reception.cancelReply();
      onSubscribeCancelList.forEach((cancel) => cancel.call({}));
    };
  }
}
