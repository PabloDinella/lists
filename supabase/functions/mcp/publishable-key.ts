type EdgeEnvironment = Record<string, string | undefined>;

export function legacyPublishableKeyOverride(env: EdgeEnvironment) {
  if (env.SUPABASE_PUBLISHABLE_KEY) return undefined;

  try {
    const configured = JSON.parse(env.SUPABASE_PUBLISHABLE_KEYS ?? "{}");
    if (
      configured &&
      typeof configured === "object" &&
      !Array.isArray(configured) &&
      Object.values(configured).some((key) => typeof key === "string" && key)
    ) return undefined;
  } catch {
    // An invalid or empty modern key set cannot initialize the user client.
  }

  const legacyAnonKey = env.SUPABASE_ANON_KEY;
  return legacyAnonKey
    ? { publishableKeys: { default: legacyAnonKey } }
    : undefined;
}
