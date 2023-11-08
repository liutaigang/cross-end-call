import { v4 as uuidv4 } from "uuid";
import { Deferred } from "@/util/deferred";
import { toType } from "@/util/to-type";
import { MsgReceiver } from "@/domain/msg-receiver";
import { MsgSender } from "@/domain/msg-sender";
import {
  CallHandler,
  ICrossEndCall,
  ReplyReception,
} from "@/domain/corss-end-call";
import { MsgReceiverCtx } from "@/cross-end-call/msg-receiver-ctx";
import { MsgSenderCtx } from "@/cross-end-call/msg-sender-ctx";

type CallReception<T> = {
  resolve: Deferred<T>["resolve"];
  reject: Deferred<T>["reject"];
  clearTimer: () => void;
};

type CallType = "PROMISE_CALL" | "PROMISE_RESOLVE" | "PROMISE_REJECT";

type Msg = {
  uid: string;
  callType: CallType;
};

type CallMsg<Params> = Msg & {
  method: string;
  params: Params;
};

type ReplyMsg = Msg & {
  returnVal: unknown;
};

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
      this.callReceptionMap.delete(uid);
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
