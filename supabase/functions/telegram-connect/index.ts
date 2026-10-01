import { createAdminClient, jsonResponse, randomSecret, requiredEnv, sha256Hex, telegramRequest } from "../_shared/telegram.ts";

function telegramUsernameLink(username: string, code: string): string {
  return `https://t.me/${encodeURIComponent(username)}?start=${encodeURIComponent(code)}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return jsonResponse({ ok: true });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization") ?? "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return jsonResponse({ error: "Authentication required" }, 401);

  try {
    const admin = createAdminClient();
    const { data: authData, error: authError } = await admin.auth.getUser(bearer);
    if (authError || !authData.user) return jsonResponse({ error: "Invalid authentication" }, 401);
    const userId = authData.user.id;

    let input: { action?: string; token?: string };
    try {
      input = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    if (!input || !["status", "connect", "pair", "disconnect"].includes(input.action ?? "")) {
      return jsonResponse({ error: "Unsupported action" }, 400);
    }

    const { data: existing, error: lookupError } = await admin
      .from("telegram_integration")
      .select("id,bot_username,telegram_user_id,chat_id,status")
      .eq("user_id", userId)
      .maybeSingle();
    if (lookupError) return jsonResponse({ error: "Could not read Telegram connection" }, 500);

    if (input.action === "status") {
      return jsonResponse({
        connected: Boolean(existing),
        ...(existing ? { botUsername: existing.bot_username, paired: existing.chat_id !== null } : {}),
      });
    }

    if (input.action === "pair") {
      if (!existing) return jsonResponse({ error: "Connect a Telegram bot first" }, 404);
      const pairCode = randomSecret(24);
      const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
      const { data: refreshed, error } = await admin.rpc("telegram_refresh_pair", {
        p_integration_id: existing.id,
        p_user_id: userId,
        p_pair_code_hash: await sha256Hex(pairCode),
        p_pair_expires_at: expiresAt,
      });
      if (error) return jsonResponse({ error: "Could not create a pairing link" }, 500);
      if (refreshed !== true) {
        return jsonResponse({ error: "This Telegram account is already paired or the connection is no longer active" }, 409);
      }
      return jsonResponse({
        connected: true,
        botUsername: existing.bot_username,
        paired: existing.chat_id !== null,
        pairLink: telegramUsernameLink(existing.bot_username, pairCode),
      });
    }

    if (input.action === "disconnect") {
      if (existing) {
        // Read the server-only token before deleting the connection so Telegram can stop deliveries.
        const tokenResult = await admin.rpc("telegram_connection_token", { p_integration_id: existing.id });
        if (!tokenResult.error && typeof tokenResult.data === "string") {
          try {
            await telegramRequest(tokenResult.data, "deleteWebhook", { drop_pending_updates: true });
          } catch {
            // The connection is still removed below; any remaining deliveries will be rejected.
          }
        }
        const { error } = await admin.rpc("telegram_delete_connection", {
          p_integration_id: existing.id,
          p_user_id: userId,
        });
        if (error) return jsonResponse({ error: "Could not disconnect Telegram bot" }, 500);
      }
      return jsonResponse({ connected: false });
    }

    if (existing) return jsonResponse({ error: "Disconnect your current bot before connecting another" }, 409);

    const token = input.token?.trim();
    if (!token || token.length > 512) return jsonResponse({ error: "Enter a valid Telegram bot token" }, 400);

    // Reject a misconfigured installation before registering a live bot.
    requiredEnv("TELEGRAM_WEBHOOK_BASE_URL");
    requiredEnv("APP_BASE_URL");

    let bot: { id: number; username?: string };
    try {
      bot = await telegramRequest(token, "getMe");
    } catch {
      return jsonResponse({ error: "Telegram could not validate that bot token" }, 400);
    }
    if (!bot.username) return jsonResponse({ error: "Telegram bot does not have a username" }, 400);

    const webhookSecret = randomSecret();
    const pairCode = randomSecret(24);
    const pairCodeHash = await sha256Hex(pairCode);
    const webhookSecretHash = await sha256Hex(webhookSecret);
    const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
    const { data: integrationId, error: createError } = await admin.rpc("telegram_create_connection", {
      p_user_id: userId,
      p_bot_id: bot.id,
      p_bot_username: bot.username,
      p_token: token,
      p_webhook_secret_hash: webhookSecretHash,
      p_pair_code_hash: pairCodeHash,
      p_pair_expires_at: expiresAt,
    });
    if (createError || typeof integrationId !== "string") {
      return jsonResponse({ error: "Could not save Telegram connection" }, 500);
    }

    try {
      const endpoint = `${requiredEnv("TELEGRAM_WEBHOOK_BASE_URL").replace(/\/$/, "")}/${encodeURIComponent(integrationId)}`;
      await telegramRequest(token, "setWebhook", {
        url: endpoint,
        secret_token: webhookSecret,
        allowed_updates: ["message"],
      });
    } catch {
      await admin.rpc("telegram_delete_connection", { p_integration_id: integrationId, p_user_id: userId });
      return jsonResponse({ error: "Telegram could not register the webhook. Check the webhook URL configuration and try again." }, 502);
    }

    return jsonResponse({
      connected: true,
      botUsername: bot.username,
      paired: false,
      pairLink: telegramUsernameLink(bot.username, pairCode),
    });
  } catch {
    return jsonResponse({ error: "Telegram connection service is unavailable" }, 500);
  }
});
