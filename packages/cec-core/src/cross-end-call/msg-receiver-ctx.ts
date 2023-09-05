import CircularJSON from "circular-json";
import { MsgHandler, MsgReceiver } from "@/domain/msg-receiver";

export class MsgReceiverCtx {
  constructor(private receiver: MsgReceiver) {}

  receive = (handler: MsgHandler) => {
    return this.receiver((msg: string) => {
      try {
        const obj = CircularJSON.parse(msg);
        handler(obj);
      } catch (error: any) {
        throw new Error("[Receive message parse failed]: " + error.toString());
      }
    });
  };
}
