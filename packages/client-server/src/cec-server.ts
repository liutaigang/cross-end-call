import { CrossEndCall, MsgSender, MsgReceiver, CallHandler } from 'cec-core';
import { uuid } from './util/uuid';

export type OnCallCancel = () => void;
export type OnSubscribeCancel = () => void;
export type SubscribleHandler = (next: (value: any) => void, ...args: any[]) => OnSubscribeCancel;

export class CecServer {
  static CALL_MSG_CACHE_DELAY = 64;
  private crossEndCall: CrossEndCall;

  constructor(
    private msgSender: MsgSender,
    private msgReceiver: MsgReceiver,
  ) {
    this.crossEndCall = new CrossEndCall(this.msgSender, this.msgReceiver);
  }

  onCall(name: string, callHandler: CallHandler): OnCallCancel {
    const reception = this.crossEndCall.reply(name, callHandler);
    return reception.cancelReply;
  }

  onSubscribe(name: string, subscribleHandler: SubscribleHandler): OnSubscribeCancel {
    const onSubscribeCancelMap: Map<string, OnSubscribeCancel> = new Map();
    const callMsgCache = new Set<any>();
    let callMsgCacheTimer: any = -1;

    const callHandler: CallHandler = (args: any[]) => {
      const subscribeId = uuid();

      const publisher = async (subscribeValue: any) => {
        callMsgCache.add({ subscribeId, subscribeValue });
        clearTimeout(callMsgCacheTimer);
        callMsgCacheTimer = setTimeout(() => {
          this.crossEndCall.call(name, Array.from(callMsgCache));
          callMsgCache.clear();
        }, CecServer.CALL_MSG_CACHE_DELAY);
      };

      const onSubscribeCancel = subscribleHandler.call({}, publisher, ...args);
      onSubscribeCancelMap.set(subscribeId, onSubscribeCancel);
      return subscribeId;
    };
    const forSubscrible = `${name}.forSubscrible`;
    const reception = this.crossEndCall.reply(forSubscrible, callHandler);

    const forSubscribleCancel = `${name}.forSubscribleCancel`;
    const subscribleCancelHandler = (subscribeId: string) => {
      const onSubscribeCancel = onSubscribeCancelMap.get(subscribeId);
      if (onSubscribeCancel) {
        onSubscribeCancelMap.delete(subscribeId);
        onSubscribeCancel.call({});
      }
    };
    const receptionCancel = this.crossEndCall.reply(forSubscribleCancel, subscribleCancelHandler);

    return () => {
      reception.cancelReply();
      receptionCancel.cancelReply();
      onSubscribeCancelMap.forEach((cancel) => cancel.call({}));
    };
  }
}
