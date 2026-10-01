import { legacyPublishableKeyOverride } from "./publishable-key.ts";

Deno.test("legacy projects provide the anon key for user-scoped clients", () => {
  const override = legacyPublishableKeyOverride({
    SUPABASE_ANON_KEY: "legacy-anon-key",
    SUPABASE_PUBLISHABLE_KEYS: "{}",
  });
  if (override?.publishableKeys.default !== "legacy-anon-key") {
    throw new Error("The legacy anon key was not selected");
  }
});

Deno.test("modern publishable keys remain the preferred configuration", () => {
  const override = legacyPublishableKeyOverride({
    SUPABASE_ANON_KEY: "legacy-anon-key",
    SUPABASE_PUBLISHABLE_KEYS: '{"default":"sb_publishable_new"}',
  });
  if (override !== undefined) {
    throw new Error("A modern key set must not be overridden");
  }
});

Deno.test("missing API keys do not silently create a fake key", () => {
  const override = legacyPublishableKeyOverride({});
  if (override !== undefined) {
    throw new Error("An absent key must remain a configuration error");
  }
});
