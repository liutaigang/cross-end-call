export type CallHandler = (...args: any[]) => any;

export type ReplyReception = {
  cancelReply: () => void;
};

export interface ICrossEndCall {
  /**
   * 调用“跨端方法”
   * @param method 方法名称
   * @param params 方法参数
   * @param timeout 调用超时时间
   * @returns 调用结果 (Promise)
   */
  call: <ReplyVal>(method: string, ...args: any[]) => Promise<ReplyVal>;
  /**
   *等待被调用
   * @param method 方法名称
   * @param callHandler 方法的逻辑处理(调用处理逻辑)
   */
  reply: (method: string, callHandler: CallHandler) => ReplyReception;
}
