export function parseNumber(value: string) {
  return parseInt(value.replaceAll(",", ""), 10);
}
