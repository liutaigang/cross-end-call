export type CallHandler<Params, ReplyVal> = (
  params: Params
) => Promise<ReplyVal>;

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
  call: <Params, RespnoseVal>(
    method: string,
    params: Params,
    timeout?: number
  ) => Promise<RespnoseVal>;
  /**
   *等待被调用
   * @param method 方法名称
   * @param callHandler 方法的逻辑处理(调用处理逻辑)
   */
  reply: <Params, ReplyVal>(
    method: string,
    callHandler: CallHandler<Params, ReplyVal>
  ) => ReplyReception;
}
