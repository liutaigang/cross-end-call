import { uuid } from '@/util/uuid';
import { Deferred } from '@/util/deferred';
import { toType } from '@/util/to-type';
import { MsgReceiver } from '@/domain/msg-receiver';
import { MsgSender } from '@/domain/msg-sender';
import { CallHandler, ICrossEndCall, ReplyReception } from '@/domain/corss-end-call';
import { MsgReceiverCtx } from '@/cross-end-call/msg-receiver-ctx';
import { MsgSenderCtx } from '@/cross-end-call/msg-sender-ctx';

export type CecConfig = {
  timeout: number;
};

type CallReception<T> = {
  resolve: Deferred<T>['resolve'];
  reject: Deferred<T>['reject'];
  clearTimer: () => void;
};

type CallType = 'PROMISE_CALL' | 'PROMISE_RESOLVE' | 'PROMISE_REJECT';

type Msg = {
  uid: string;
  callType: CallType;
};

type CallMsg = Msg & {
  method: string;
  args: any[];
};

type ReplyMsg = Msg & {
  returnVal: unknown;
};

export class CrossEndCall implements ICrossEndCall {
  static DEFAULT_CALL_TIME_OUT = 36000;
  private callReceptionMap = new Map<string, CallReception<any>>();
  private callHandlerMap = new Map<string, CallHandler>();

  private sendCtx: MsgSenderCtx;
  private receiveCtx: MsgReceiverCtx;

  constructor(
    private msgSender: MsgSender,
    private msgReceiver: MsgReceiver,
    private config?: CecConfig,
  ) {
    this.sendCtx = new MsgSenderCtx(this.msgSender);
    this.receiveCtx = new MsgReceiverCtx(this.msgReceiver);
    this.handleCallAndReply();
  }

  call = <ReplyVal>(method: string, ...args: any[]) => {
    const uid = uuid();
    const { reject, resolve, promise } = new Deferred<ReplyVal>();

    const delayTime = this?.config?.timeout ?? CrossEndCall.DEFAULT_CALL_TIME_OUT;
    const timer = setTimeout(() => {
      this.callReceptionMap.delete(uid);
      reject(new Error(`Method ${method} has called fail, reason: timeout`));
    }, delayTime);
    const clearTimer = () => clearTimeout(timer);
    this.callReceptionMap.set(uid, { reject, resolve, clearTimer });

    const callMsg: CallMsg = {
      uid,
      method,
      callType: 'PROMISE_CALL',
      args,
    };
    this.sendCtx.send(callMsg)!;
    return promise;
  };

  reply = (method: string, callHandler: CallHandler): ReplyReception => {
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

      if (callType === 'PROMISE_CALL') {
        if (this.callReceptionMap.has(uid)) {
          return;
        }

        const { method, args } = msg as CallMsg;
        const callHandler = this.callHandlerMap.get(method);
        if (!callHandler) {
          this.sendError(msg as Msg, `The method [${method}] does not have a corresponding handler`);
          return;
        }

        const result = callHandler.apply({}, args);

        if (toType(result) === 'promise') {
          const reply: ReplyMsg = {} as any;
          result
            .then((res: any) => {
              reply.returnVal = res;
              reply.callType = 'PROMISE_RESOLVE';
            })
            .catch((err: Error) => {
              reply.returnVal = err.toString();
              reply.callType = 'PROMISE_REJECT';
            })
            .finally(() => {
              reply.uid = uid;
              this.sendCtx.send(reply);
            });
        } else {
          const reply: ReplyMsg = {
            returnVal: result,
            callType: 'PROMISE_RESOLVE',
            uid,
          };
          this.sendCtx.send(reply);
        }
      }

      if (callType === 'PROMISE_RESOLVE' || callType === 'PROMISE_REJECT') {
        if (!this.callReceptionMap.has(uid)) {
          return;
        }

        const { returnVal } = msg as ReplyMsg;
        const { resolve, reject, clearTimer } = this.callReceptionMap.get(uid)!;
        if (callType === 'PROMISE_RESOLVE') {
          resolve(returnVal);
        } else if (callType === 'PROMISE_REJECT') {
          reject(new Error((returnVal as string).toString()));
        }

        clearTimer();
        this.callReceptionMap.delete(uid);
      }
    });
  }

  private sendError(reply: Msg, error: string) {
    this.sendCtx.send({
      callType: 'PROMISE_REJECT',
      returnVal: error,
      uid: reply.uid,
    });
  }
}
