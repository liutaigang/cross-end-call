export type MsgHandler<Msg = any> = (msg: Msg) => void;

export interface MsgReceiver {
  (msgHandler: MsgHandler): void;
}
