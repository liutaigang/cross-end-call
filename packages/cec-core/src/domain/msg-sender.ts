export interface MsgSender<Msg = any> {
  (msg: Msg): void;
}
