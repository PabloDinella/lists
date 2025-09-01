import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import debugLib from "debug";
import { marked } from "marked";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const debug = debugLib("lists");

// Configure marked for inline rendering
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // Enable GitHub Flavored Markdown
});

/**
 * Renders markdown text to HTML with safe defaults
 */
export function renderMarkdown(text: string): string {
  // Use marked.parseInline for inline content to avoid wrapping in <p> tags
  return marked.parseInline(text, {
    async: false,
  }) as string;
}
