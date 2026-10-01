import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";

type ConnectedAppGrant = {
  client: {
    id: string;
    name: string;
  };
  scopes: string[];
  granted_at: string;
};

export function ConnectedAppsSettings() {
  const mcpUrl = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/mcp`
    : "";
  const [grants, setGrants] = useState<ConnectedAppGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [confirmClientId, setConfirmClientId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadGrants = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.auth.oauth.listGrants();
      if (error) throw error;
      setGrants((data ?? []) as ConnectedAppGrant[]);
    } catch {
      setErrorMessage("Could not load connected apps. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  const revokeGrant = async (grant: ConnectedAppGrant) => {
    setPendingClientId(grant.client.id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.auth.oauth.revokeGrant({ clientId: grant.client.id });
      if (error) throw error;
      setGrants((current) => current.filter((item) => item.client.id !== grant.client.id));
      setConfirmClientId(null);
      setSuccessMessage(`${grant.client.name} no longer has access to your account.`);
    } catch {
      setErrorMessage(`Could not revoke access for ${grant.client.name}. Please try again.`);
    } finally {
      setPendingClientId(null);
    }
  };

  return (
    <section className="mt-8 border-t pt-6" aria-labelledby="connected-apps-heading">
      <div className="space-y-4">
        <div>
          <h2 id="connected-apps-heading" className="text-xl font-semibold">
            Connected apps
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Apps you have authorized to access your Trylists account. Their identity scopes do not limit access to your Lists data.
          </p>
        </div>

        {mcpUrl && (
          <div className="rounded-md border border-border p-4">
            <h3 className="font-medium">Connect an MCP client</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add this URL as a remote MCP server in your AI client. Sign in to Trylists and approve access when prompted.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                aria-label="MCP server URL"
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                readOnly
                value={mcpUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(mcpUrl);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                    setErrorMessage("Could not copy the URL. Select it from the field instead.");
                  }
                }}
              >
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground" role="status">Loading connected apps…</p>
        ) : errorMessage && grants.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive" role="alert">{errorMessage}</p>
            <Button variant="outline" onClick={() => void loadGrants()}>Try again</Button>
          </div>
        ) : grants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No apps are connected to your account.</p>
        ) : (
          <ul className="space-y-3">
            {grants.map((grant) => (
              <li key={grant.client.id} className="rounded-md border border-border p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-medium">{grant.client.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(grant.granted_at).toLocaleDateString()}
                    </p>
                    {grant.scopes.length > 0 && (
                      <p className="break-words text-xs text-muted-foreground">
                        Identity scopes: {grant.scopes.join(", ")}
                      </p>
                    )}
                  </div>
                  {confirmClientId === grant.client.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm">Revoke access?</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void revokeGrant(grant)}
                        disabled={pendingClientId !== null}
                      >
                        {pendingClientId === grant.client.id ? "Revoking…" : "Confirm"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmClientId(null)}
                        disabled={pendingClientId !== null}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setConfirmClientId(grant.client.id);
                      }}
                      disabled={pendingClientId !== null}
                    >
                      Revoke access
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {errorMessage && grants.length > 0 && (
          <p className="text-sm text-destructive" role="alert">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="text-sm text-green-600 dark:text-green-400" role="status">{successMessage}</p>
        )}
      </div>
    </section>
  );
}
