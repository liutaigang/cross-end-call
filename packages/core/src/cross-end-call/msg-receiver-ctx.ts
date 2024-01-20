import { parse } from 'flatted';
import { MsgHandler, MsgReceiver } from '@/domain/msg-receiver';

export class MsgReceiverCtx {
  constructor(private receiver: MsgReceiver) {}

  receive = (handler: MsgHandler) => {
    return this.receiver.call({}, (msg: string) => {
      try {
        handler.call({}, parse(msg));
      } catch (error: any) {
        throw new Error('[Receive message parse failed]: ' + error.toString());
      }
    });
  };
}
