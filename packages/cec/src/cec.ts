import { MsgReceiver , MsgSender } from "@cec/core";


export abstract class Cec {
  constructor(private msgSender: MsgSender, private msgReceiver: MsgReceiver) {}
}
