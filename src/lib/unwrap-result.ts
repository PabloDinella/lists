export function unwrapResult<T>(value: { result: T } | { error: unknown }): { result: T } {
  if ("error" in value) {
    throw value.error instanceof Error ? value.error : new Error(String(value.error));
  }
  return value;
}
