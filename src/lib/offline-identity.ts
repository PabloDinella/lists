import type { User } from "@supabase/supabase-js";

const KEY = "lists-offline-identity";

export function rememberOfflineIdentity(user: User): void {
  localStorage.setItem(KEY, JSON.stringify({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  }));
}

export function readOfflineIdentity(): User | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null") as
      | { id?: unknown; email?: unknown; created_at?: unknown }
      | null;
    if (!value || typeof value.id !== "string" || typeof value.created_at !== "string") return null;
    return {
      id: value.id,
      aud: "authenticated",
      role: "authenticated",
      email: typeof value.email === "string" ? value.email : undefined,
      created_at: value.created_at,
      app_metadata: {},
      user_metadata: {},
    };
  } catch {
    return null;
  }
}

export function forgetOfflineIdentity(): void {
  localStorage.removeItem(KEY);
}
