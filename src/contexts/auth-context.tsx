import { useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { usePostHog } from "posthog-js/react";
import { supabase } from "@/lib/supabase";
import { AuthContext, AuthContextType } from "./auth-context-types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const posthog = usePostHog();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      
      // Identify user with PostHog
      if (user) {
        posthog?.identify(user.id, {
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      setLoading(false);
      
      // Handle PostHog identify/reset based on auth state
      if (event === 'SIGNED_IN' && newUser) {
        posthog?.identify(newUser.id, {
          email: newUser.email,
          created_at: newUser.created_at,
          last_sign_in_at: newUser.last_sign_in_at,
        });
      } else if (event === 'SIGNED_OUT') {
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
