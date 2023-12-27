import {
  CecConfig,
  CrossEndCall,
  MsgReceiver,
  MsgSender,
  ReplyReception,
} from "@cec/core";

export type SubscribleCancel = () => void;

export class CecClient {
  private crossEndCall: CrossEndCall;
  private observerMap: Map<
    string,
    {
      observers: Set<(value: any) => void>;
      reception: ReplyReception;
    }
  > = new Map();

  constructor(
    private msgSender: MsgSender,
    private msgReceiver: MsgReceiver,
    private config?: CecConfig
  ) {
    this.crossEndCall = new CrossEndCall(
      this.msgSender,
      this.msgReceiver,
      this.config
    );
  }

  call<ReplyVal = any>(name: string, ...args: any[]): Promise<ReplyVal> {
    return this.crossEndCall.call(name, ...args);
  }

  subscrible(name: string, observer: (value: any) => void): SubscribleCancel {
    if (this.observerMap.has(name)) {
      this.observerMap.get(name)?.observers.add(observer);
    } else {
      const notifyAllObservers = (value: any) => {
        const observers = this.observerMap.get(name)?.observers ?? [];
        for (const observ of observers) {
          observ.call({}, value);
        }
      };
      const reception = this.crossEndCall.reply(name, notifyAllObservers);
      this.observerMap.set(name, {
        observers: new Set([observer]),
        reception,
      });
    }

    return () => {
      if (this.observerMap.has(name)) {
        const observers = this.observerMap.get(name)?.observers ?? new Set();
        observers.delete(observer);

        if (observers.size === 0) {
          this.observerMap.get(name)?.reception.cancelReply();
          this.observerMap.delete(name);
        }
      }
    };
  }
}
