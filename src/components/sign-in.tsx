import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Logo } from "./ui/logo";

export function SignIn({ onSignIn }: { onSignIn?: () => void }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // No automatic redirect - let users stay on sign-in page if they want

  const redirectTo = `${window.location.origin}/app`;
  console.log(redirectTo);


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
        <form onSubmit={handleSignIn} className="bg-card border border-border shadow-lg rounded-lg p-8 w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Sign In</h2>
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
      )}
    </div>
  );
}
