import { MsgReceiverCtx } from "../../src/cross-end-call/msg-receiver-ctx";
import { MsgReceiver, MsgHandler } from "../../src/domain/msg-receiver";

describe("MsgReceiveCtx", () => {
  test("[Normal] MsgReceiveCtx::receive", () => {
    const testObjStr = JSON.stringify({ a: 1, b: 2, c: { b: 3 } });

    const msgReceiver: MsgReceiver = (msgHandler: MsgHandler) => {
      msgHandler(testObjStr);
    };
    const msgReceiveCtx = new MsgReceiverCtx(msgReceiver);

    msgReceiveCtx.receive((msg) => {
      expect(msg).toEqual(JSON.parse(testObjStr));
    });
  });

  test("[Error] MsgReceiveCtx::receive", () => {
    const cannotPrase = { a: 1, b: 2, c: { b: 3 } };

    const msgReceiver: MsgReceiver = (msgHandler: MsgHandler) => {
      msgHandler(cannotPrase);
    };
    const msgReceiveCtx = new MsgReceiverCtx(msgReceiver);

    try {
      msgReceiveCtx.receive(() => {});
    } catch (error) {
      expect(String(error)).toMatch("[Receive message parse failed]");
    }
  });
});
