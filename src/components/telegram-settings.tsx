import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type TelegramStatus = {
  connected: boolean;
  botUsername?: string;
  paired?: boolean;
  pairLink?: string;
};

type TelegramAction = "status" | "connect" | "pair" | "disconnect";

async function invokeTelegram(
  action: TelegramAction,
  token?: string,
): Promise<TelegramStatus> {
  const { data, error } = await supabase.functions.invoke("telegram-connect", {
    body: { action, ...(token ? { token } : {}) },
  });

  if (error) {
    throw error;
  }

  return data as TelegramStatus;
}

export function TelegramSettings() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      setStatus(await invokeTelegram("status"));
    } catch {
      setErrorMessage("Could not load your Telegram connection. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const handleConnect = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token.trim()) {
      setErrorMessage("Paste the bot token from BotFather to continue.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      setStatus(await invokeTelegram("connect", token.trim()));
      setToken("");
      setSuccessMessage("Bot connected. Pair your Telegram account to finish setup.");
    } catch {
      setErrorMessage(
        "We could not connect that bot. Check the token with BotFather and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      setStatus(await invokeTelegram("disconnect"));
      setConfirmDisconnect(false);
      setSuccessMessage("Telegram bot disconnected.");
    } catch {
      setErrorMessage("Could not disconnect your bot. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePairLink = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      setStatus(await invokeTelegram("pair"));
    } catch {
      setErrorMessage("Could not create a pairing link. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 border-t pt-6" aria-labelledby="telegram-heading">
      <div className="space-y-4">
        <div>
          <h2 id="telegram-heading" className="text-xl font-semibold">
            Telegram Inbox
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send a private message to your personal Telegram bot to capture it
            in your Inbox.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading Telegram status...</p>
        ) : status?.connected ? (
          <div className="space-y-3">
            <p className="text-sm">
              Connected to <strong>@{status.botUsername ?? "your bot"}</strong>
              {status.paired ? " and ready to capture messages." : "."}
            </p>
            {!status.paired && status.pairLink && (
              <div className="space-y-2 rounded-md border p-4">
                <p className="text-sm font-medium">Pair your Telegram account</p>
                <p className="text-sm text-muted-foreground">
                  Open this link in Telegram, then send <code>/start</code> to
                  your bot. The link expires after 15 minutes.
                </p>
                <a
                  className="text-sm text-primary underline underline-offset-4"
                  href={status.pairLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Telegram pairing link
                </a>
                <div>
                  <Button variant="outline" onClick={() => void handleCreatePairLink()} disabled={saving}>
                    {saving ? "Creating link..." : "Generate a new link"}
                  </Button>
                </div>
              </div>
            )}
            {!status.paired && !status.pairLink && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Create a pairing link, open it in Telegram, then send <code>/start</code> to your bot.
                </p>
                <Button onClick={() => void handleCreatePairLink()} disabled={saving}>
                  {saving ? "Creating link..." : "Create pairing link"}
                </Button>
              </div>
            )}

            {!confirmDisconnect ? (
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void refreshStatus()} disabled={loading || saving}>
                  Refresh status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDisconnect(true)}
                  disabled={saving}
                >
                  Disconnect bot
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-md border border-destructive/40 p-4">
                <p className="text-sm">
                  Disconnect this bot? It will stop sending messages to your Inbox.
                </p>
                <div className="flex gap-3">
                  <Button variant="destructive" onClick={() => void handleDisconnect()} disabled={saving}>
                    {saving ? "Disconnecting..." : "Confirm disconnect"}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmDisconnect(false)} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleConnect}>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Create a bot with <a className="text-primary underline underline-offset-4" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a> in Telegram. Send <code>/newbot</code>, follow its prompts, then paste the token it gives you here.
              </p>
              <Label htmlFor="telegram-bot-token">Bot token</Label>
              <Input
                id="telegram-bot-token"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="123456789:ABC..."
                disabled={saving}
                aria-describedby="telegram-token-note"
              />
              <p id="telegram-token-note" className="text-xs text-muted-foreground">
                The token is sent securely to connect your bot and is not saved in this form.
              </p>
            </div>
            <Button type="submit" disabled={saving || !token.trim()}>
              {saving ? "Connecting..." : "Connect bot"}
            </Button>
          </form>
        )}

        {errorMessage && <p className="text-sm text-red-600" role="alert">{errorMessage}</p>}
        {successMessage && <p className="text-sm text-green-600" role="status">{successMessage}</p>}
      </div>
    </section>
  );
}
