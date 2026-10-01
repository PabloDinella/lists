# Capture Inbox items from Telegram

Send a message to your own Telegram bot and it will appear in your Inbox. This is useful when you want to capture a thought without opening the app.

## Connect a bot

1. In Telegram, open [@BotFather](https://t.me/BotFather) and send `/newbot`.
2. Follow BotFather's prompts to name your bot. Copy the bot token it gives you. Keep this token private.
3. In the app, open **Settings → Telegram Inbox**.
4. Paste the token into **Bot token** and select **Connect bot**.
5. Select **Open Telegram pairing link**. In Telegram, tap **Start** to send the pairing command from that link. A plain `/start` message without the link's code will not pair your account.
6. Return to Settings and select **Refresh status**. When it says the bot is ready to capture messages, setup is complete.

You can connect one bot to your account at a time. The bot accepts Inbox messages only from the Telegram account you paired in a private chat.

## Add an Inbox item

Open a private chat with your bot and send a text message. For example:

```text
Pick up a birthday card
Stop at the bookstore on Friday
```

The first line becomes the item's title. Any additional lines become its content. The bot replies with a link to the new Inbox item. You can organize it in the app later.

## If the pairing link expires

Pairing links expire after 15 minutes. In **Settings → Telegram Inbox**, select **Generate a new link** or **Create pairing link**, then open that link and tap **Start** in Telegram.

## Manage your connection

To stop using the bot, open **Settings → Telegram Inbox** and select **Disconnect bot**. To use a different bot or Telegram account, disconnect the current bot, then connect and pair again.

If a bot token is exposed, rotate it with BotFather before reconnecting the bot in the app.

## What can I send?

For now, the bot captures **new text messages in a private chat**. It does not capture messages from groups or channels, photos, voice messages, files, or edits to earlier messages. You can send `/help` to the bot for a short reminder.

## Troubleshooting

- **The bot does not respond after I send a message.** Check that Settings shows the bot as paired, that you are messaging it privately from the paired Telegram account, and that you sent text rather than an attachment.
- **The pairing link is invalid or expired.** Generate a new link in Settings, open it in Telegram, and tap **Start** from that link.
- **The token is rejected.** Copy the current token from BotFather again and make sure it belongs to the bot you want to connect.
- **The bot says your Inbox is not set up.** Choose an Inbox in the app's Settings, then resend your message.
- **I still need help.** Contact support with your bot's username and a description of what happened. Never send your bot token to support.
