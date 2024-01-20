import { Subject } from 'rxjs';
import { CecClient } from '../src/cec-client';
import { CecServer } from '../src/cec-server';

describe('CorssEndCall', () => {
  let cecClient: CecClient;
  let cecServer: CecServer;

  beforeEach(() => {
    const messageBus = new Subject();
    const msgSender = (msg: any) => {
      setTimeout(() => {
        messageBus.next(msg);
      }, 10);
    };
    const msgReceiver = (next: any) => {
      messageBus.asObservable().subscribe({ next });
    };

    cecClient = new CecClient(msgSender, msgReceiver);
    cecServer = new CecServer(msgSender, msgReceiver);
  });

  test('[Normal] CorssEndCall Server/Client in Call', (done) => {
    cecServer.onCall('getSum', (num01, num02, num03) => {
      return num01 + num02 + num03;
    });
    cecClient.call('getSum', 1, 2, 3).then((res) => {
      expect(res).toEqual(6);
      done();
    });

    cecServer.onCall('getSumPromise', (num01, num02, num03) => {
      return Promise.resolve(num01 + num02 + num03);
    });
    cecClient.call('getSumPromise', 1, 2, 3).then((res) => {
      expect(res).toEqual(6);
      done();
    });
  });

  test('[Cancel] CorssEndCall Server/Client in Call', (done) => {
    const callCancel = cecServer.onCall('cancel', (num01) => {
      return num01;
    });
    callCancel();

    cecClient.call('cancel', 1).catch((err) => {
      expect(err.toString()).toMatch('corresponding handler');
      done();
    });
  });

  test('[Normal] CorssEndCall Server/Client in Subscribe', (done) => {
    let count = 0;

    cecServer.onSubscribe('notify', (next) => {
      const timer = setTimeout(() => next('xxx'), 1000);
      return () => {
        clearTimeout(timer);
      };
    });

    cecClient.subscrible('notify', (value) => {
      expect(value).toEqual('xxx');
      count++;
    });

    cecClient.subscrible('notify', (value) => {
      count++;
      setTimeout(() => {
        expect(count).toEqual(2);
        done();
      });
    });
  });

  test('[Cancel] CorssEndCall Server/Client in Subscribe', (done) => {
    let count = 0;

    cecServer.onSubscribe('notify', (next) => {
      setTimeout(() => next('xxx'), 1000);
      return () => {};
    });

    const cancel01 = cecClient.subscrible('notify', (value) => {
      expect(value).toEqual('xxx');
      count++;
    });
    setTimeout(cancel01);

    const cancel02 = cecClient.subscrible('notify', (value) => {
      expect(value).toEqual('xxx');
      count++;
    });
    setTimeout(cancel02, 999);

    cecClient.subscrible('notify', () => {
      count++;
      setTimeout(() => {
        expect(count).toEqual(1);
        done();
      });
    });
  });

  test('[Duplicate Name] CorssEndCall Server/Client in Subscribe&Call', (done) => {
    cecServer.onCall('sameName', () => {
      return 'call_samename';
    });
    cecServer.onSubscribe('sameName', (next) => {
      const timer = setTimeout(() => next('subscribe_samename'), 1000);
      return () => {
        clearTimeout(timer);
      };
    });
    cecClient.subscrible('sameName', (value) => {
      expect(value).toEqual('subscribe_samename');
      setTimeout(done, 500);
    });
    cecClient.call('sameName').then((res) => {
      expect(res).toEqual('call_samename');
    });
  });

  test('[With Arguments] CorssEndCall Server/Client in Subscribe', (done) => {
    const name = 'notify';

    cecServer.onSubscribe(name, (next, ...args: string[]) => {
      const timer = setTimeout(() => next(name + args.join('')), 1000);
      return () => {
        clearTimeout(timer);
      };
    });

    const args01 = ['1', '2', '3'];
    cecClient.subscrible(
      name,
      (value) => {
        expect(value).toEqual(name + args01.join(''));
      },
      ...args01,
    );

    const args02 = ['x', 'y', 'z'];
    cecClient.subscrible(
      name,
      (value) => {
        expect(value).toEqual(name + args02.join(''));
        setTimeout(done);
      },
      ...args02,
    );
  });

  test('[Subscribe cancel] CorssEndCall Server/Client in Subscribe', (done) => {
    const name = 'notify';
    let isCancel = false;

    cecServer.onSubscribe(name, (next) => {
      const timer = setTimeout(next, 1000);
      return () => {
        isCancel = true;
        clearTimeout(timer);
      };
    });

    const subscribeCancel = cecClient.subscrible(name, () => {});
    subscribeCancel();
    setTimeout(() => {
      expect(isCancel).toBeTruthy();
      done();
    }, 500);
  });
});
