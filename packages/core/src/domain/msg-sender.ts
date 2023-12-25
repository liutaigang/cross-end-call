export interface MsgSender<MsgBody = any> {
  (msg: MsgBody): void;
}
