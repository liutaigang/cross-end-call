import { MsgSender, MsgReceiver, CecConfig } from '@cec/core';
export { CecConfig, MsgReceiver, MsgSender } from '@cec/core';

type SubscribleCancel = () => void;
declare class CecClient {
    private msgSender;
    private msgReceiver;
    private config?;
    private crossEndCall;
    private observerMap;
    constructor(msgSender: MsgSender, msgReceiver: MsgReceiver, config?: CecConfig | undefined);
    call<ReplyVal = any>(name: string, ...args: any[]): Promise<ReplyVal>;
    subscrible(name: string, observer: (value: any) => void): SubscribleCancel;
}

type OnCallCancel = () => void;
type OnSubscribeCancel = () => void;
declare class CecServer {
    private msgSender;
    private msgReceiver;
    private crossEndCall;
    constructor(msgSender: MsgSender, msgReceiver: MsgReceiver);
    onCall(name: string, callHandler: (...args: any[]) => any): OnCallCancel;
    onSubscribe(name: string, subscribleHandler: (next: (value: any) => void) => OnSubscribeCancel): OnSubscribeCancel;
}

export { CecClient, CecServer, type OnCallCancel, type OnSubscribeCancel, type SubscribleCancel };
