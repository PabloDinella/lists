import { useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { usePostHog } from "posthog-js/react";
import { supabase } from "@/lib/supabase";
import { AuthContext, AuthContextType } from "./auth-context-types";
import { forgetOfflineIdentity, readOfflineIdentity, rememberOfflineIdentity } from "@/lib/offline-identity";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const posthog = usePostHog();

  useEffect(() => {
    // A cached session lets a returning user open local data while disconnected.
    // Supabase will validate or refresh it when a connection is available.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      const cachedUser = session?.user ?? (error || !navigator.onLine ? readOfflineIdentity() : null);
      if (!session && !error && navigator.onLine) forgetOfflineIdentity();
      setUser(cachedUser);
      setLoading(false);
      if (cachedUser) {
        if (session?.user) rememberOfflineIdentity(session.user);
        posthog?.identify(cachedUser.id, {
          email: cachedUser.email,
          created_at: cachedUser.created_at,
          last_sign_in_at: cachedUser.last_sign_in_at,
        });
      }
      if (navigator.onLine) {
        void supabase.auth.getUser().then(({ data: { user }, error }) => {
          if (!error) setUser(user);
        });
      }
    }).catch(() => {
      setUser(readOfflineIdentity());
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? (!navigator.onLine ? readOfflineIdentity() : null);
      if (session?.user) rememberOfflineIdentity(session.user);
      if (event === "SIGNED_OUT" && navigator.onLine) forgetOfflineIdentity();
      setUser(newUser);
      setLoading(false);
      
      // Handle PostHog identify/reset based on auth state
      if (event === 'SIGNED_IN' && newUser) {
        posthog?.identify(newUser.id, {
          email: newUser.email,
          created_at: newUser.created_at,
          last_sign_in_at: newUser.last_sign_in_at,
        });
      } else if (event === 'SIGNED_OUT' && !newUser) {
        posthog?.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [posthog]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
