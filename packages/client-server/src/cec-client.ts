import {
  CecConfig,
  CrossEndCall,
  MsgReceiver,
  MsgSender,
  ReplyReception,
} from "cec-core";

export type SubscribleCancel = () => void;
export type MsgObserver = (value: any) => void;

export class CecClient {
  private crossEndCall: CrossEndCall;
  private observerMap: Map<
    string,
    {
      observers: Map<string, MsgObserver>;
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

  subscrible(
    name: string,
    observer: MsgObserver,
    ...args: any[]
  ): SubscribleCancel {
    let subscribleCancel = () => {};

    const toSubsscrible = (subscribeId: string) => {
      if (this.observerMap.has(name)) {
        this.observerMap.get(name)?.observers.set(subscribeId, observer);
      } else {
        const notifyAllObservers = (
          values: {
            subscribeValue: any;
            subscribeId: string;
          }[]
        ) => {
          for (const { subscribeValue, subscribeId } of values) {
            const observersMap = this.observerMap.get(name)?.observers;
            observersMap?.get(subscribeId)?.call({}, subscribeValue);
          }
        };
        const reception = this.crossEndCall.reply(name, notifyAllObservers);
        this.observerMap.set(name, {
          observers: new Map([[subscribeId, observer]]),
          reception,
        });
      }

      subscribleCancel = () => {
        if (this.observerMap.has(name)) {
          const observers = this.observerMap.get(name)?.observers;
          if (observers) observers.delete(subscribeId);
          if (observers?.size === 0) {
            this.observerMap.get(name)?.reception.cancelReply();
            this.observerMap.delete(name);
          }
        }
      };
    };

    const forSubscrible = `${name}.forSubscrible`;
    const callPromse = this.crossEndCall.call(forSubscrible, args);
    callPromse.then((subscribeId) => toSubsscrible(subscribeId as string));

    return async () => {
      await callPromse;
      subscribleCancel();
    };
  }
}
