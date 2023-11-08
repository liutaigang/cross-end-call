import { Subject } from "rxjs";
import { MsgReceiver, MsgHandler } from "@/domain/msg-receiver";
import { CrossEndCall } from "@/cross-end-call";
import { Deferred } from "@/util/deferred";

describe("CorssEndCall", () => {
  let messageBus: Subject<any>;
  let msgSender: MsgHandler;
  let msgReceiver: MsgReceiver;

  beforeEach(() => {
    messageBus = new Subject();
    msgSender = (msg: any) => {
      messageBus.next(msg);
    };
    msgReceiver = (msgHander) => {
      messageBus.asObservable().subscribe({
        next: msgHander,
      });
    };
  });

  test("[Normal] CorssEndCall", (done) => {
    const replyEnd = new CrossEndCall(msgSender, msgReceiver);
    replyEnd.reply("onCallMothed", (msg) => {
      return Promise.resolve({ isAns: true, data: msg });
    });

    const callEnd = new CrossEndCall(msgSender, msgReceiver);
    callEnd.call("onCallMothed", "Hello CorssEndCall").then((res: any) => {
      expect(res.isAns).toBeTruthy();
      done();
    });
  });

  test("[Timeout] CorssEndCall", (done) => {
    const REPLY_WAIT_TIME = 1000;
    const CALL_TIMEOUT = 999;
    const replyEnd = new CrossEndCall(msgSender, msgReceiver);
    replyEnd.reply("onCallMothed", (msg) => {
      const { resolve, promise } = new Deferred();
      setTimeout(() => {
        resolve({ isAns: true, data: msg });
      }, REPLY_WAIT_TIME);
      return promise;
    });

    const callEnd = new CrossEndCall(msgSender, msgReceiver);
    callEnd
      .call("onCallMothed", "Hello CorssEndCall", CALL_TIMEOUT)
      .catch((err: any) => {
        expect(err.toString()).toMatch("timeout");
        done();
      });
  });

  test("[Error: without handler] CorssEndCall", (done) => {
    const replyEnd = new CrossEndCall(msgSender, msgReceiver);
    replyEnd.reply("onCallMothed", () => {
      return Promise.resolve();
    });

    const callEnd = new CrossEndCall(msgSender, msgReceiver);
    callEnd.call("_", "Hello CorssEndCall").catch((err: any) => {
      expect(err.toString()).toMatch("not have a corresponding handler");
      done();
    });
  });

  test("[Error: not return Promise] CorssEndCall", (done) => {
    const replyEnd = new CrossEndCall(msgSender, msgReceiver);
    replyEnd.reply("onCallMothed", () => {
      return "Promise.resolve()" as any;
    });

    const callEnd = new CrossEndCall(msgSender, msgReceiver);
    callEnd.call("onCallMothed", "Hello CorssEndCall").catch((err: any) => {
      expect(err.toString()).toMatch("not of the Promise type");
      done();
    });
  });
});
