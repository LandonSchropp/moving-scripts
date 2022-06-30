export function parseNumber(value: string) {
  return value ? parseFloat(value?.replaceAll(",", "")) : null;
}
