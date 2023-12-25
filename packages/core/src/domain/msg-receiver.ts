export type MsgHandler<MsgBody = any> = (msg: MsgBody) => void;

export interface MsgReceiver {
  (msgHandler: MsgHandler): void;
}
