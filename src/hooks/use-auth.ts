import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNewUserSetup } from './use-new-user-setup';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const newUserSetupMutation = useNewUserSetup();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      setLoading(false);

      // If this is a sign-in event and we have a user, check if they need setup
      if (event === 'SIGNED_IN' && newUser) {
        try {
          await newUserSetupMutation.mutateAsync({ userId: newUser.id });
        } catch (error) {
          console.error('Failed to set up new user:', error);
          // Don't fail the authentication process if setup fails
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [newUserSetupMutation]);

  return { user, loading, isAuthenticated: !!user };
}
