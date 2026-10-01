import { createAdminClient, jsonResponse, requiredEnv, sha256Hex, telegramSendMessage } from "../_shared/telegram.ts";
import { parseCaptureText } from "../_shared/capture-text.ts";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    from?: { id: number; is_bot?: boolean };
    chat: { id: number; type: string };
  };
};

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function parseStartCode(text: string): string | null {
  const match = text.trim().match(/^\/start(?:@[A-Za-z0-9_]+)?\s+([A-Za-z0-9_-]{16,128})\s*$/);
  return match?.[1] ?? null;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const integrationId = new URL(request.url).pathname.split("/").filter(Boolean).at(-1);
  if (!integrationId || integrationId === "telegram-webhook") return jsonResponse({ error: "Not found" }, 404);

  try {
    const admin = createAdminClient();
    const { data: integration, error: lookupError } = await admin
      .from("telegram_integration")
      .select("id,bot_username,webhook_secret_hash,pair_code_hash,pair_expires_at,telegram_user_id,chat_id,status")
      .eq("id", integrationId)
      .maybeSingle();
    if (lookupError) return jsonResponse({ error: "Connection lookup failed" }, 500);
    // A deleted account or disconnected bot may still have queued updates.
    if (!integration || integration.status !== "active") return jsonResponse({ ok: true });

    const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
    const secretHash = await sha256Hex(secret);
    if (!secret || !constantTimeEqual(secretHash, integration.webhook_secret_hash)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let update: TelegramUpdate;
    try {
      update = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid update" }, 400);
    }
    const message = update.message;
    if (!Number.isSafeInteger(update.update_id) || !message || !Number.isSafeInteger(message.chat?.id)) {
      return jsonResponse({ ok: true });
    }

    if (message.chat.type !== "private" || !message.from || message.from.is_bot) return jsonResponse({ ok: true });

    const text = message.text?.trim();
    if (!text) return jsonResponse({ ok: true });

    if (integration.chat_id === null || integration.telegram_user_id === null) {
      const code = parseStartCode(text);
      if (!code) return jsonResponse({ ok: true });
      const tokenResult = await admin.rpc("telegram_connection_token", { p_integration_id: integration.id });
      const token = tokenResult.data;
      if (tokenResult.error || typeof token !== "string" || !token) return jsonResponse({ error: "Connection unavailable" }, 500);
      if (integration.pair_expires_at && Date.parse(integration.pair_expires_at) <= Date.now()) {
        await telegramSendMessage(token, message.chat.id, "That pairing link has expired. Generate a new one in your app's Telegram settings.");
        return jsonResponse({ ok: true });
      }
      const paired = await admin.rpc("telegram_pair", {
        p_integration_id: integration.id,
        p_pair_code_hash: await sha256Hex(code),
        p_telegram_user_id: message.from.id,
        p_chat_id: message.chat.id,
      });
      if (paired.error) return jsonResponse({ error: "Could not complete pairing" }, 500);
      await telegramSendMessage(token, message.chat.id, paired.data
        ? "Telegram is connected. Send me a message any time to add it to your Inbox."
        : "That pairing link is invalid or has expired. Generate a new one in your app's Telegram settings.");
      return jsonResponse({ ok: true });
    }

    if (message.chat.id !== integration.chat_id || message.from.id !== integration.telegram_user_id) {
      return jsonResponse({ ok: true });
    }

    const tokenResult = await admin.rpc("telegram_connection_token", { p_integration_id: integration.id });
    const token = tokenResult.data;
    if (tokenResult.error || typeof token !== "string" || !token) return jsonResponse({ error: "Connection unavailable" }, 500);

    if (/^\/help(?:@[A-Za-z0-9_]+)?(?:\s|$)/i.test(text)) {
      await telegramSendMessage(token, message.chat.id, "Send me a message and I'll add it to your Inbox. Use /help to see this message.");
      return jsonResponse({ ok: true });
    }
    if (/^\/start(?:@[A-Za-z0-9_]+)?(?:\s|$)/i.test(text)) {
      await telegramSendMessage(token, message.chat.id, "You're connected. Send me a message any time to add it to your Inbox.");
      return jsonResponse({ ok: true });
    }
    if (text.startsWith("/")) {
      await telegramSendMessage(token, message.chat.id, "I don't recognize that command. Send /help to see what I can do.");
      return jsonResponse({ ok: true });
    }

    const { title, content } = parseCaptureText(text);
    const capture = await admin.rpc("telegram_capture", {
      p_integration_id: integration.id,
      p_update_id: update.update_id,
      p_telegram_user_id: message.from.id,
      p_chat_id: message.chat.id,
      p_title: title,
      p_content: content,
    });
    if (capture.error) {
      if (capture.error.message === "Inbox is not configured") {
        await telegramSendMessage(token, message.chat.id, "I couldn't add that because your Inbox isn't set up. Choose an Inbox in the app's settings, then try again.");
        return jsonResponse({ ok: true });
      }
      return jsonResponse({ error: "Could not capture Telegram message" }, 500);
    }

    const result = capture.data as { created?: boolean; node_id?: number } | null;
    if (result?.created) {
      const itemUrl = new URL(`/lists/${result.node_id}`, requiredEnv("APP_BASE_URL")).toString();
      await telegramSendMessage(token, message.chat.id, `Added to your Inbox: ${itemUrl}`);
    }
    else await telegramSendMessage(token, message.chat.id, "That message was already added to your Inbox.");
    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse({ error: "Webhook processing failed" }, 500);
  }
});
