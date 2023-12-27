type MsgHandler<MsgBody = any> = (msg: MsgBody) => void;
interface MsgReceiver {
    (msgHandler: MsgHandler): void;
}

interface MsgSender<MsgBody = any> {
    (msg: MsgBody): void;
}

type CallHandler = (...args: any[]) => any;
type ReplyReception = {
    cancelReply: () => void;
};
interface ICrossEndCall {
    /**
     * 调用“跨端方法”
     * @param method 方法名称
     * @param params 方法参数
     * @param timeout 调用超时时间
     * @returns 调用结果 (Promise)
     */
    call: <ReplyVal>(method: string, ...args: any[]) => Promise<ReplyVal>;
    /**
     *等待被调用
     * @param method 方法名称
     * @param callHandler 方法的逻辑处理(调用处理逻辑)
     */
    reply: (method: string, callHandler: CallHandler) => ReplyReception;
}

type CecConfig = {
    timeout: number;
};
declare class CrossEndCall implements ICrossEndCall {
    private msgSender;
    private msgReceiver;
    private config?;
    static DEFAULT_CALL_TIME_OUT: number;
    private callReceptionMap;
    private callHandlerMap;
    private sendCtx;
    private receiveCtx;
    constructor(msgSender: MsgSender, msgReceiver: MsgReceiver, config?: CecConfig | undefined);
    call: <ReplyVal>(method: string, ...args: any[]) => Promise<ReplyVal>;
    reply: (method: string, callHandler: CallHandler) => ReplyReception;
    private handleCallAndReply;
    private sendError;
}

export { type CallHandler, type CecConfig, CrossEndCall, type MsgHandler, type MsgReceiver, type MsgSender, type ReplyReception };
