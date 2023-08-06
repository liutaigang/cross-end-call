export function toType(obj: any): string | undefined {
  const match = Object.prototype.toString.call(obj).match(/[a-zA-Z]+/g)?.[1];
  return match?.toString().toLowerCase();
}
