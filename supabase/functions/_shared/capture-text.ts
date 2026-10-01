export function parseCaptureText(text: string): { title: string; content: string } {
  const [firstLine, ...remainingLines] = text.trim().split(/\r?\n/);
  const trimmedFirstLine = firstLine.trim();
  const title = trimmedFirstLine.slice(0, 500) || "Telegram message";
  const overflow = trimmedFirstLine.slice(500);
  const content = [overflow, ...remainingLines].filter(Boolean).join("\n").trim();
  return { title, content };
}
