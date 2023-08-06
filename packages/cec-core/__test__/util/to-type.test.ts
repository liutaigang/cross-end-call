import { toType } from "../../src/util/to-type";

describe("toType", () => {
  test("toType normal test", () => {
    const isString = toType("") === "string";
    const isNumber = toType(1) === "number";
    const isObj = toType({}) === "object";
    const isArr = toType([]) === "array";
    const isPromise = toType(Promise.reject()) === "promise";
    expect(isString && isNumber && isObj && isArr && isPromise).toEqual(true);
  });
});
