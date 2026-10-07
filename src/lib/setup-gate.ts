export function createSetupGate<T>() {
  const inFlight = new Map<string, Promise<T>>();

  return (userId: string, work: () => Promise<T>): Promise<T> => {
    const existing = inFlight.get(userId);
    if (existing) return existing;

    const pending = Promise.resolve().then(work);
    inFlight.set(userId, pending);
    void pending.finally(() => {
      if (inFlight.get(userId) === pending) inFlight.delete(userId);
    }).catch(() => undefined);
    return pending;
  };
}
