import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Logo } from "./ui/logo";

// Type declarations for Google Sign-In API
interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: string | ((response: GoogleCredentialResponse) => void);
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (element: HTMLElement | null, config: {
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            logo_alignment?: string;
            width?: string;
          }) => void;
        };
      };
    };
  }
}

export function SignIn({ onSignIn }: { onSignIn?: () => void }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const redirectTo = `${window.location.origin}/app`;

  // Handle Google Sign-In response
  const handleGoogleSignIn = useCallback(async (response: GoogleCredentialResponse) => {
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });
      
      if (error) {
        console.error('Error signing in with Google:', error);
        setError(`Google sign-in failed: ${error.message}`);
        return;
      }
      
      setMessage('Successfully signed in with Google!');
      
      // Redirect after successful sign-in
      if (onSignIn) {
        onSignIn();
      }
      
      // Navigate to app
      setTimeout(() => {
        navigate('/app');
      }, 1000);
      
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      setError('An unexpected error occurred during Google sign-in');
    }
  }, [navigate, onSignIn]);

  // Initialize Google Sign-In when component mounts
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      // Check if Google API is loaded
      if (typeof window !== 'undefined' && window.google) {
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        
        if (googleClientId) {
          try {
            // Use a direct callback function instead of string reference
            window.google!.accounts.id.initialize({
              client_id: googleClientId,
              callback: (response: GoogleCredentialResponse) => {
                console.log('Google Sign-In callback received:', response);
                handleGoogleSignIn(response);
              },
              auto_select: false,
              cancel_on_tap_outside: true,
              use_fedcm_for_prompt: false, // Disable FedCM to avoid COOP issues
            });
            
            // Render the button after initialization
            window.google!.accounts.id.renderButton(
              document.getElementById('google-signin-button'),
              {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: '100%'
              }
            );
            
            setGoogleLoaded(true);
            console.log('Google Sign-In initialized successfully');
          } catch (err) {
            console.error('Error initializing Google Sign-In:', err);
          }
        } else {
          console.warn('VITE_GOOGLE_CLIENT_ID is not set');
        }
      }
    };

    // Try to initialize immediately, or wait for Google API to load
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for Google API to load
      const checkGoogle = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(checkGoogle);
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
    }
  }, [handleGoogleSignIn]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the login link!");
      if (onSignIn) onSignIn();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      {/* Logo Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Logo width={48} height={48} />
          <span className="text-2xl font-bold">trylists.app</span>
        </Link>
      </div>

      {isAuthenticated ? (
        <div className="bg-card border border-border shadow-lg rounded-lg p-8 w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Welcome back!</h2>
          <p className="text-muted-foreground mb-6">You're already signed in.</p>
          <Button 
            onClick={() => navigate('/app')} 
            className="w-full mb-2"
          >
            Open App
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border shadow-lg rounded-lg p-8 w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-foreground text-center">Sign In</h2>
          
          {/* Google Sign-In Button */}
          <div className="mb-6">
            <div id="google-signin-button" className="w-full flex justify-center"></div>
            {!googleLoaded && import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="text-sm text-muted-foreground text-center">
                Loading Google Sign-In...
              </div>
            )}
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="text-sm text-muted-foreground text-center">
                Google Sign-In not configured
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSignIn}>
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mb-4"
            />
            <Button type="submit" className="w-full mb-2" disabled={loading}>
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
            {error && <div className="text-destructive text-sm mt-2">{error}</div>}
            {message && <div className="text-green-600 dark:text-green-400 text-sm mt-2">{message}</div>}
          </form>
        </div>
      )}
    </div>
  );
}
