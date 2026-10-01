import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { Logo } from "./ui/logo";

type AuthorizationDetails = OAuthAuthorizationDetails & {
  client: OAuthAuthorizationDetails["client"] & { name: string };
};

function formatScope(scope: string): string[] {
  return [...new Set(scope.split(/\s+/).filter(Boolean))];
}

export function OAuthConsent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const authorizationId = searchParams.get("authorization_id");
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      if (authorizationId) {
        const consentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        navigate(`/sign-in?next=${encodeURIComponent(consentPath)}`, { replace: true });
      } else {
        setError("This authorization request is missing its request ID.");
        setLoading(false);
      }
      return;
    }
    if (!authorizationId) {
      setError("This authorization request is missing its request ID.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase.auth.oauth.getAuthorizationDetails(authorizationId).then(({ data, error: requestError }) => {
      if (cancelled) return;
      if (requestError || !data) {
        setError(requestError?.message ?? "Could not load this authorization request.");
      } else if (!("authorization_id" in data)) {
        // Supabase returns a redirect immediately when this client was already approved.
        window.location.assign(data.redirect_url);
      } else {
        setDetails(data as AuthorizationDetails);
      }
      setLoading(false);
    }).catch((requestError: unknown) => {
      if (cancelled) return;
      setError(requestError instanceof Error ? requestError.message : "Could not load this authorization request.");
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [authLoading, authorizationId, isAuthenticated, navigate]);

  const respond = useCallback(async (choice: "approve" | "deny") => {
    if (!authorizationId || decision) return;
    setDecision(choice);
    setError(null);
    try {
      const { data, error: responseError } = choice === "approve"
        ? await supabase.auth.oauth.approveAuthorization(authorizationId)
        : await supabase.auth.oauth.denyAuthorization(authorizationId);
      if (responseError) throw responseError;
      if (!data?.redirect_url) throw new Error("The authorization service did not return a redirect URL.");
      window.location.assign(data.redirect_url);
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : "Could not submit your choice.");
      setDecision(null);
    }
  }, [authorizationId, decision]);

  const scopes = details?.scope ? formatScope(details.scope) : [];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-8 flex items-center gap-2 transition-opacity hover:opacity-80">
        <Logo width={40} height={40} />
        <span className="text-xl font-bold">trylists.app</span>
      </Link>

      <section className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-bold text-foreground">Authorize access</h1>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground" role="status">Loading authorization details…</p>
        ) : error && !details ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
            {error}
          </div>
        ) : details ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">{details.client.name}</strong> wants to connect to your Trylists account.
            </p>

            <div className="mt-6 space-y-5 rounded-md border border-border p-4 text-sm">
              <div>
                <h2 className="font-semibold text-foreground">Application</h2>
                <p className="mt-1 break-words text-muted-foreground">{details.client.name}</p>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Return address</h2>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{details.redirect_uri}</p>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Requested permissions</h2>
                {scopes.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    {scopes.map((scope) => <li key={scope}>{scope}</li>)}
                  </ul>
                ) : (
                  <p className="mt-1 text-muted-foreground">No additional scopes requested.</p>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              This connection receives account access with the same data permissions as your sign-in session. The MCP tools currently read items and create Inbox items. Only approve if you trust this application.
            </p>
            {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => respond("deny")} disabled={decision !== null}>
                {decision === "deny" ? "Declining…" : "Deny"}
              </Button>
              <Button onClick={() => respond("approve")} disabled={decision !== null}>
                {decision === "approve" ? "Approving…" : "Approve access"}
              </Button>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
