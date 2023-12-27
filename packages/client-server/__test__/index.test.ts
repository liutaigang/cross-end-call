import { Subject } from "rxjs";
import { CecClient } from "@/cec-client";
import { CecServer } from "@/cec-server";

describe("CorssEndCall", () => {
  let cecClient: CecClient;
  let cecServer: CecServer;

  beforeEach(() => {
    const messageBus = new Subject();
    const msgSender = (msg: any) => {
      messageBus.next(msg);
    };
    const msgReceiver = (next: any) => {
      messageBus.asObservable().subscribe({ next });
    };

    cecClient = new CecClient(msgSender, msgReceiver);
    cecServer = new CecServer(msgSender, msgReceiver);
  });

  test("[Normal] CorssEndCall Server/Client in Call", (done) => {
    cecServer.onCall("getSum", (num01, num02, num03) => {
      return num01 + num02 + num03;
    });
    cecClient.call("getSum", 1, 2, 3).then((res) => {
      expect(res).toEqual(6);
      done();
    });

    cecServer.onCall("getSumPromise", (num01, num02, num03) => {
      return Promise.resolve(num01 + num02 + num03);
    });
    cecClient.call("getSumPromise", 1, 2, 3).then((res) => {
      expect(res).toEqual(6);
      done();
    });
  });

  test("[Cancel] CorssEndCall Server/Client in Call", (done) => {
    const callCancel = cecServer.onCall("cancel", (num01) => {
      return num01;
    });
    callCancel();

    cecClient.call("cancel", 1).catch((err) => {
      expect(err.toString()).toMatch("corresponding handler");
      done();
    });
  });

  test("[Normal] CorssEndCall Server/Client in Subscribe", (done) => {
    let count = 0;

    cecServer.onSubscribe("notify", (next) => {
      const timer = setTimeout(() => next("xxx"), 1000);
      return () => {
        clearTimeout(timer);
      };
    });

    cecClient.subscrible("notify", (value) => {
      expect(value).toEqual("xxx");
      count++;
    });

    cecClient.subscrible("notify", (value) => {
      count++;
      setTimeout(() => {
        expect(count).toEqual(2);
        done();
      });
    });
  });

  test("[Cancel] CorssEndCall Server/Client in Subscribe", (done) => {
    let count = 0;

    cecServer.onSubscribe("notify", (next) => {
      setTimeout(() => next("xxx"), 1000);
      return () => {};
    });

    const cancel = cecClient.subscrible("notify", (value) => {
      expect(value).toEqual("xxx");
      count++;
    });
    cancel();

    cecClient.subscrible("notify", () => {
      count++;
      setTimeout(() => {
        expect(count).toEqual(1);
        done();
      });
    });
  });
});
