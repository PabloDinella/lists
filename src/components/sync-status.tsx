import { useEffect, useState } from "react";
import { getOfflineStore, type OfflineStore } from "@/lib/offline";
import { Button } from "./ui/button";

type State = ReturnType<OfflineStore["status"]>;

export function SyncStatus({ userId }: { userId: string | null }) {
  const [store, setStore] = useState<OfflineStore | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    setStore(null);
    setState(null);
    if (!userId) return;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    getOfflineStore(userId).then((current) => {
      if (disposed) return;
      setStore(current);
      setState(current.status());
      unsubscribe = current.subscribe(() => setState(current.status()));
    }).catch(console.error);
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      disposed = true;
      unsubscribe?.();
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, [userId]);

  if (!state) return null;
  let label: string;
  if (!online) label = state.pending ? `Offline · ${state.pending} pending` : "Offline";
  else if (state.error) label = state.pending ? `Sync issue · ${state.pending} pending` : "Sync issue";
  else if (state.pending) label = `Syncing · ${state.pending} pending`;
  else label = state.initialSyncComplete ? "Synced" : "Connecting";

  return (
    <Button
      variant="ghost"
      size="sm"
      className="shrink-0 text-xs"
      title={state.error ?? undefined}
      onClick={() => { if (store && online) void store.syncNow().catch(console.error); }}
      aria-label={state.error ? `${label}: ${state.error}. Retry sync` : label}
    >
      {label}
    </Button>
  );
}
