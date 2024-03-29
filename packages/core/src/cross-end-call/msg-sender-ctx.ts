import { stringify } from 'flatted';
import { MsgSender } from '@/domain/msg-sender';

export class MsgSenderCtx {
  constructor(private sender: MsgSender) {}

  send = <Msg>(msg: Msg) => {
    try {
      this.sender.call({}, stringify(msg));
    } catch (error: any) {
      throw new Error('[Send message stringify failed]: ' + error.toString());
    }
  };
}
