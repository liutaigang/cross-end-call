export type SubscribleCancel = () => void;

export class CecClient {
  constructor() {}

  call(name: string, ...args: any[]): Promise<any> {
    return new Promise<any>(() => {});
  }

  subscrible(
    name: string,
    msgReceiver: (...args: any[]) => void
  ): SubscribleCancel {
    return () => {};
  }
}
