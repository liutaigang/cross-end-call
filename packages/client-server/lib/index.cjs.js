'use strict';

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native = {
  randomUUID
};

function v4(options, buf, offset) {
  if (native.randomUUID && !buf && !options) {
    return native.randomUUID();
  }

  options = options || {};
  const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return unsafeStringify(rnds);
}

class Deferred {
    promise;
    resolve;
    reject;
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}

function toType(obj) {
    const match = Object.prototype.toString.call(obj).match(/[a-zA-Z]+/g)?.[1];
    return match?.toString().toLowerCase();
}

/*! (c) 2020 Andrea Giammarchi */

const {parse: $parse, stringify: $stringify} = JSON;
const {keys} = Object;

const Primitive = String;   // it could be Number
const primitive = 'string'; // it could be 'number'

const ignore = {};
const object = 'object';

const noop = (_, value) => value;

const primitives = value => (
  value instanceof Primitive ? Primitive(value) : value
);

const Primitives = (_, value) => (
  typeof value === primitive ? new Primitive(value) : value
);

const revive = (input, parsed, output, $) => {
  const lazy = [];
  for (let ke = keys(output), {length} = ke, y = 0; y < length; y++) {
    const k = ke[y];
    const value = output[k];
    if (value instanceof Primitive) {
      const tmp = input[value];
      if (typeof tmp === object && !parsed.has(tmp)) {
        parsed.add(tmp);
        output[k] = ignore;
        lazy.push({k, a: [input, parsed, tmp, $]});
      }
      else
        output[k] = $.call(output, k, tmp);
    }
    else if (output[k] !== ignore)
      output[k] = $.call(output, k, value);
  }
  for (let {length} = lazy, i = 0; i < length; i++) {
    const {k, a} = lazy[i];
    output[k] = $.call(output, k, revive.apply(null, a));
  }
  return output;
};

const set = (known, input, value) => {
  const index = Primitive(input.push(value) - 1);
  known.set(value, index);
  return index;
};

const parse = (text, reviver) => {
  const input = $parse(text, Primitives).map(primitives);
  const value = input[0];
  const $ = reviver || noop;
  const tmp = typeof value === object && value ?
              revive(input, new Set, value, $) :
              value;
  return $.call({'': tmp}, '', tmp);
};

const stringify = (value, replacer, space) => {
  const $ = replacer && typeof replacer === object ?
            (k, v) => (k === '' || -1 < replacer.indexOf(k) ? v : void 0) :
            (replacer || noop);
  const known = new Map;
  const input = [];
  const output = [];
  let i = +set(known, input, $.call({'': value}, '', value));
  let firstRun = !i;
  while (i < input.length) {
    firstRun = true;
    output[i] = $stringify(input[i++], replace, space);
  }
  return '[' + output.join(',') + ']';
  function replace(key, value) {
    if (firstRun) {
      firstRun = !firstRun;
      return value;
    }
    const after = $.call(this, key, value);
    switch (typeof after) {
      case object:
        if (after === null) return after;
      case primitive:
        return known.get(after) || set(known, input, after);
    }
    return after;
  }
};

class MsgReceiverCtx {
    receiver;
    constructor(receiver) {
        this.receiver = receiver;
    }
    receive = (handler) => {
        return this.receiver((msg) => {
            try {
                const obj = parse(msg);
                handler(obj);
            }
            catch (error) {
                throw new Error("[Receive message parse failed]: " + error.toString());
            }
        });
    };
}

class MsgSenderCtx {
    sender;
    constructor(sender) {
        this.sender = sender;
    }
    send = (msg) => {
        try {
            const str = stringify(msg);
            this.sender(str);
        }
        catch (error) {
            throw new Error("[Send message stringify failed]: " + error.toString());
        }
    };
}

class CrossEndCall {
    msgSender;
    msgReceiver;
    config;
    static DEFAULT_CALL_TIME_OUT = 36000;
    callReceptionMap = new Map();
    callHandlerMap = new Map();
    sendCtx;
    receiveCtx;
    constructor(msgSender, msgReceiver, config) {
        this.msgSender = msgSender;
        this.msgReceiver = msgReceiver;
        this.config = config;
        this.sendCtx = new MsgSenderCtx(this.msgSender);
        this.receiveCtx = new MsgReceiverCtx(this.msgReceiver);
        this.handleCallAndReply();
    }
    call = (method, ...args) => {
        const uid = v4();
        const { reject, resolve, promise } = new Deferred();
        const delayTime = this?.config?.timeout ?? CrossEndCall.DEFAULT_CALL_TIME_OUT;
        const timer = setTimeout(() => {
            this.callReceptionMap.delete(uid);
            reject(new Error(`Method ${method} has called fail, reason: timeout`));
        }, delayTime);
        const clearTimer = () => clearTimeout(timer);
        this.callReceptionMap.set(uid, { reject, resolve, clearTimer });
        const callMsg = {
            uid,
            method,
            callType: "PROMISE_CALL",
            args,
        };
        this.sendCtx.send(callMsg);
        return promise;
    };
    reply = (method, callHandler) => {
        this.callHandlerMap.set(method, callHandler);
        return {
            cancelReply: () => {
                this.callHandlerMap.delete(method);
            },
        };
    };
    handleCallAndReply() {
        this.receiveCtx.receive((msg) => {
            const { uid, callType } = msg;
            if (callType === "PROMISE_CALL") {
                if (this.callReceptionMap.has(uid)) {
                    return;
                }
                const { method, args } = msg;
                const callHandler = this.callHandlerMap.get(method);
                if (!callHandler) {
                    this.sendError(msg, `The method [${method}] does not have a corresponding handler`);
                    return;
                }
                const result = callHandler.apply(this, args);
                if (toType(result) === "promise") {
                    const reply = {};
                    result
                        .then((res) => {
                        reply.returnVal = res;
                        reply.callType = "PROMISE_RESOLVE";
                    })
                        .catch((err) => {
                        reply.returnVal = err.toString();
                        reply.callType = "PROMISE_REJECT";
                    })
                        .finally(() => {
                        reply.uid = uid;
                        this.sendCtx.send(reply);
                    });
                }
                else {
                    const reply = {
                        returnVal: result,
                        callType: "PROMISE_RESOLVE",
                        uid,
                    };
                    this.sendCtx.send(reply);
                }
            }
            if (callType === "PROMISE_RESOLVE" || callType === "PROMISE_REJECT") {
                if (!this.callReceptionMap.has(uid)) {
                    return;
                }
                const { returnVal } = msg;
                const { resolve, reject, clearTimer } = this.callReceptionMap.get(uid);
                if (callType === "PROMISE_RESOLVE") {
                    resolve(returnVal);
                }
                else if (callType === "PROMISE_REJECT") {
                    reject(new Error(returnVal.toString()));
                }
                clearTimer();
                this.callReceptionMap.delete(uid);
            }
        });
    }
    sendError(reply, error) {
        this.sendCtx.send({
            callType: "PROMISE_REJECT",
            returnVal: error,
            uid: reply.uid,
        });
    }
}

class CecClient {
    msgSender;
    msgReceiver;
    config;
    crossEndCall;
    observerMap = new Map();
    constructor(msgSender, msgReceiver, config) {
        this.msgSender = msgSender;
        this.msgReceiver = msgReceiver;
        this.config = config;
        this.crossEndCall = new CrossEndCall(this.msgSender, this.msgReceiver, this.config);
    }
    call(name, ...args) {
        return this.crossEndCall.call(name, ...args);
    }
    subscrible(name, observer) {
        if (this.observerMap.has(name)) {
            this.observerMap.get(name)?.observers.add(observer);
        }
        else {
            const notifyAllObservers = (value) => {
                const observers = this.observerMap.get(name)?.observers ?? [];
                for (const observ of observers) {
                    observ.call({}, value);
                }
            };
            const reception = this.crossEndCall.reply(name, notifyAllObservers);
            this.observerMap.set(name, {
                observers: new Set([observer]),
                reception,
            });
        }
        return () => {
            if (this.observerMap.has(name)) {
                const observers = this.observerMap.get(name)?.observers ?? new Set();
                observers.delete(observer);
                if (observers.size === 0) {
                    this.observerMap.get(name)?.reception.cancelReply();
                    this.observerMap.delete(name);
                }
            }
        };
    }
}

class CecServer {
    msgSender;
    msgReceiver;
    crossEndCall;
    constructor(msgSender, msgReceiver) {
        this.msgSender = msgSender;
        this.msgReceiver = msgReceiver;
        this.crossEndCall = new CrossEndCall(this.msgSender, this.msgReceiver);
    }
    onCall(name, callHandler) {
        const reception = this.crossEndCall.reply(name, callHandler);
        return reception.cancelReply;
    }
    onSubscribe(name, subscribleHandler) {
        const next = (value) => {
            this.crossEndCall.call(name, value);
        };
        return subscribleHandler.call({}, next);
    }
}

exports.CecClient = CecClient;
exports.CecServer = CecServer;
