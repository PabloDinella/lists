import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SiteLayout } from "@/components/site-layout";
import { Check, Clock } from "lucide-react";
import { useEffect } from "react";

export function PricingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to the app
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin">
          <Logo width={32} height={32} />
        </div>
      </div>
    );
  }

  return (
    <SiteLayout>
      {/* Early Testing Alert Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <Container>
          <div className="flex flex-col items-center justify-center gap-2 py-3 text-center sm:flex-row sm:gap-4">
            <div className="text-sm sm:text-base">
              <span className="opacity-90">
                We're in early testing! Help us improve by trying the app and
                sharing your feedback.
              </span>
              <a
                href="mailto:hello@trylists.app"
                className="ml-2 underline underline-offset-2 hover:no-underline"
              >
                Send feedback →
              </a>
            </div>
          </div>
        </Container>
      </div>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Pricing Plans <br />
              <span className="text-primary">Coming Soon</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
              We're working hard to create fair and flexible pricing plans that
              work for everyone. For now, enjoy full access to trylists.app
              completely free.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate("/sign-in")}
                className="px-8 py-3 text-lg"
              >
                Start Free Today
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg"
                onClick={() => navigate("/")}
              >
                Learn More
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Current Status Section */}
      <section className="bg-muted/30 py-20">
        <Container>
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold">What's Available Now</h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                During our early testing phase, everything is completely free.
                No limits, no restrictions.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Free Early Access</h3>
                  <p className="text-muted-foreground">
                    Full access during testing phase
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">$0</div>
                  <div className="text-sm text-muted-foreground">
                    Limited time
                  </div>
                </div>
              </div>

              <div className="mb-8 grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Unlimited Lists & Tasks</div>
                    <div className="text-sm text-muted-foreground">
                      Create as many lists and tasks as you need
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Full GTD Workflow</div>
                    <div className="text-sm text-muted-foreground">
                      Complete Getting Things Done implementation
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Powerful Search</div>
                    <div className="text-sm text-muted-foreground">
                      Find anything instantly across all your data
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Import & Export</div>
                    <div className="text-sm text-muted-foreground">
                      Bring your data from Nirvana and other tools
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Cloud Sync</div>
                    <div className="text-sm text-muted-foreground">
                      Access your data from anywhere
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">All Future Features</div>
                    <div className="text-sm text-muted-foreground">
                      Get access to new features as we build them
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => navigate("/sign-in")}
                className="w-full"
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
