import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FeedbackAlertBar } from "@/components/ui/feedback-alert-bar";
import { Menu, X } from "lucide-react";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function SiteLayout({ children }: MarketingLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Logo width={32} height={32} />
              <span className="text-lg font-bold sm:text-xl">trylists.app</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <Link
                to="/pricing"
                className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Pricing
              </Link>
              <a
                href="https://x.com/trylists"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:block text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Follow us on X (Twitter)"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 fill-current"
                >
                  <title>X</title>
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
              </a>
              <Button 
                onClick={() => navigate(user ? "/app" : "/sign-in")}
              >
                {user ? "Open App" : "Sign In"}
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center gap-2">
              <Button 
                onClick={() => navigate(user ? "/app" : "/sign-in")}
                size="sm"
              >
                {user ? "App" : "Sign In"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden border-t bg-background/95 backdrop-blur">
              <div className="py-4 space-y-2">
                <Link
                  to="/pricing"
                  className="block px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <a
                  href="https://x.com/trylists"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 fill-current"
                  >
                    <title>X</title>
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                  Follow on X
                </a>
                <a
                  href="https://trylistsapp.featurebase.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Feedback & Support
                </a>
              </div>
            </div>
          )}
        </Container>
      </header>

      {/* Early Testing Alert Bar */}
      <FeedbackAlertBar />

      {/* Content */}
      {children}

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-0">
            <Link
              to="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Logo width={24} height={24} />
              <span className="font-semibold">trylists.app</span>
            </Link>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="https://x.com/trylists"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Follow us on X (Twitter)"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 fill-current"
                >
                  <title>X</title>
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
              </a>
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                © 2025 trylists.app. Built for productivity enthusiasts.
              </p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
