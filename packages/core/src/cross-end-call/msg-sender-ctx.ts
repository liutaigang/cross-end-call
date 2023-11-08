import CircularJSON from "circular-json";
import { MsgSender } from "@/domain/msg-sender";

export class MsgSenderCtx {
  constructor(private sender: MsgSender) {}

  send = <Msg>(msg: Msg) => {
    try {
      const str = CircularJSON.stringify(msg);
      this.sender(str);
    } catch (error: any) {
      throw new Error("[Send message stringify failed]: " + error.toString());
    }
  };
}
