export type CallableCancel = () => void;
export type SubscribableCancall = () => void;

class CecServer {
  constructor() {}
  addCallable(name: String, handler: (...args: any[]) => any): CallableCancel {
    return () => {};
  }
  
  addSubscribable(
    name: String,
    next: (...args: any[]) => void
  ): SubscribableCancall {
    

    return () => {};
  }
}
