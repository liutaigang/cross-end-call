import { v4 as uuidv4 } from "uuid";
import { Deferred } from "@/domain/deferred";
import { MsgReceiver } from "@/domain/msg-receiver";
import { MsgSender } from "@/domain/msg-sender";
import { toType } from "@/util/to-type";
import { MsgReceiverCtx } from "@/cross-end-call/msg-receiver-ctx";
import { MsgSenderCtx } from "@/cross-end-call/msg-sender-ctx";

type CallReception<T> = {
  resolve: Deferred<T>["resolve"];
  reject: Deferred<T>["reject"];
  clearTimer: () => void;
};

type Msg = {
  uid: string;
  callType: "PROMISE_CALL" | "PROMISE_RESOLVE" | "PROMISE_REJECT";
};

type CallMsg<Params> = Msg & {
  method: string;
  params: Params;
};

type ReplyMsg = Msg & {
  returnVal: unknown;
};

export type CallHandler<Params, ReplyVal> = (
  params: Params
) => Promise<ReplyVal>;

export type ReplyReception = {
  cancelReply: () => void;
};

export interface ICrossEndCall {
  /**
   * 调用“跨端方法”
   * @param method 方法名称
   * @param params 方法参数
   * @param timeout 调用超时时间
   * @returns 调用结果 (Promise)
   */
  call: <Params, RespnoseVal>(
    method: string,
    params: Params,
    timeout?: number
  ) => Promise<RespnoseVal>;
  /**
   *等待被调用
   * @param method 方法名称
   * @param callHandler 方法的逻辑处理(调用处理逻辑)
   */
  reply: <Params, ReplyVal>(
    method: string,
    callHandler: CallHandler<Params, ReplyVal>
  ) => ReplyReception;
}

export class CrossEndCall implements ICrossEndCall {
  static DEFAULT_CALL_TIME_OUT = 3000;
  private callReceptionMap = new Map<string, CallReception<any>>();
  private callHandlerMap = new Map<string, CallHandler<any, any>>();

  private sendCtx: MsgSenderCtx;
  private receiveCtx: MsgReceiverCtx;
  constructor(private msgSender: MsgSender, private msgReceiver: MsgReceiver) {
    this.sendCtx = new MsgSenderCtx(this.msgSender);
    this.receiveCtx = new MsgReceiverCtx(this.msgReceiver);
    this.handleCallAndReply();
  }

  call = <Params, RespnoseVal>(
    method: string,
    params: Params,
    timeout = CrossEndCall.DEFAULT_CALL_TIME_OUT
  ) => {
    const uid = uuidv4();
    const { reject, resolve, promise } = new Deferred<RespnoseVal>();
    const timer = setTimeout(() => {
      this.callReceptionMap.delete(uid); // 超时释放
      reject(new Error(`Method ${method} has called fail, reason: timeout`));
    }, timeout);
    const clearTimer = () => clearTimeout(timer);
    this.callReceptionMap.set(uid, { reject, resolve, clearTimer });
    const callMsg: CallMsg<Params> = {
      uid,
      method,
      callType: "PROMISE_CALL",
      params,
    };
    this.sendCtx.send(callMsg)!;
    return promise;
  };

  reply = <Params, ReplyVal>(
    method: string,
    callHandler: CallHandler<Params, ReplyVal>
  ): ReplyReception => {
    this.callHandlerMap.set(method, callHandler);
    return {
      cancelReply: () => {
        this.callHandlerMap.delete(method);
      },
    };
  };

  private handleCallAndReply() {
    this.receiveCtx.receive((msg: unknown) => {
      const { uid, callType } = msg as Msg;

      if (callType === "PROMISE_CALL") {
        // 避免公有通道的消息混乱
        if (this.callReceptionMap.has(uid)) {
          return;
        }

        const { method, params } = msg as CallMsg<any>;
        const callHandler = this.callHandlerMap.get(method);
        if (!callHandler) {
          this.sendError(
            msg as Msg,
            `The method [${method}] does not have a corresponding handler`
          );
          return;
        }

        const promise = callHandler.call(this, params);
        if (toType(promise) !== "promise") {
          this.sendError(
            msg as Msg,
            `The return value of method [${method}] is not of the Promise type`
          );
          return;
        }

        const reply: ReplyMsg = {} as any;
        promise
          .then((res) => {
            reply.returnVal = res;
            reply.callType = "PROMISE_RESOLVE";
          })
          .catch((err) => {
            reply.returnVal = err.toString();
            reply.callType = "PROMISE_REJECT";
          })
          .finally(() => {
            reply.uid = uid;
            this.sendCtx.send(reply);
          });
      }

      if (callType === "PROMISE_RESOLVE" || callType === "PROMISE_REJECT") {
        // 作用: 1、因为 uid 的唯一性，可以保证的消息混乱;2、超时后 ReplyRecetion被释放后找不到
        if (!this.callReceptionMap.has(uid)) {
          return;
        }

        const { returnVal } = msg as ReplyMsg;
        const { resolve, reject, clearTimer } = this.callReceptionMap.get(uid)!;
        if (callType === "PROMISE_RESOLVE") {
          resolve(returnVal);
        } else if (callType === "PROMISE_REJECT") {
          reject(new Error((returnVal as string).toString()));
        }

        clearTimer();
        this.callReceptionMap.delete(uid);
      }
    });
  }

  private sendError(reply: Msg, error: string) {
    this.sendCtx.send({
      callType: "PROMISE_REJECT",
      returnVal: error,
      uid: reply.uid,
    });
  }
}
