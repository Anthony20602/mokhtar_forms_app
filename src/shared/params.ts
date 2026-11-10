/** First value of a URL query parameter (`?a=1&a=2` gives "1"); "" when it is missing. */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
