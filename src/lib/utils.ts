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
 * Truncate long URLs in link text
 */
function truncateLongLinks(html: string): string {
  const maxLinkLength = 50;
  
  // Replace links where the href and text are the same (auto-generated links)
  return html.replace(/<a([^>]*)href="([^"]*)"([^>]*)>([^<]*)<\/a>/g, (_match, beforeHref, href, afterHref, text) => {
    let displayText = text;
    
    // If the link text is a URL and it's too long, truncate it
    if (text && text.length > maxLinkLength && (text.startsWith('http') || text.startsWith('www') || text === href)) {
      displayText = text.substring(0, maxLinkLength) + '...';
    }
    
    // Add target="_blank" and styling if not already present
    const hasTarget = afterHref.includes('target=');
    
    let attributes = beforeHref + afterHref;
    if (!hasTarget) {
      attributes += ' target="_blank" rel="noopener noreferrer"';
    }
    
    return `<a href="${href}"${attributes}>${displayText}</a>`;
  });
}

/**
 * Renders markdown text to HTML with safe defaults
 */
export function renderMarkdown(text: string): string {
  // Use marked.parseInline for inline content to avoid wrapping in <p> tags
  const html = marked.parseInline(text, {
    async: false,
  }) as string;
  
  // Post-process to truncate long links
  return truncateLongLinks(html);
}
