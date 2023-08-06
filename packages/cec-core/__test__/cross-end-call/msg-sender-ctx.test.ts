import { MsgSenderCtx } from "../../src/cross-end-call/msg-sender-ctx";
import { MsgSender } from "../../src/domain/msg-sender";

describe("MsgSenderCtx", () => {
  test("[Normal] MsgSenderCtx.send", () => {
    const msgBody = { a: 1, b: 2, c: { b: 3 } };

    const msgSender: MsgSender = (msg) => {
      const msgBodyStr = JSON.stringify(msgBody);
      expect(msg).toEqual(msgBodyStr);
    };
    const msgSenderCtx = new MsgSenderCtx(msgSender);

    msgSenderCtx.send(msgBody);
  });

  test("[Error] MsgSenderCtx.send", () => {
    // circular structure
    const a = {} as any;
    const b = { x: a };
    a.x = b;

    const msgSender: MsgSender = () => {};
    const msgSenderCtx = new MsgSenderCtx(msgSender);

    try {
      msgSenderCtx.send(a);
    } catch (error) {
      expect(String(error)).toMatch("[Send message stringify failed]");
    }
  });
});
