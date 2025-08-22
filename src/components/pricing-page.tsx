import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Check, Clock, Bell, Star } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo width={32} height={32} />
              <span className="text-xl font-bold">trylists.app</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
              <a
                href="https://x.com/trylists"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
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
              <Button onClick={() => navigate("/sign-in")}>Sign In</Button>
            </div>
          </div>
        </Container>
      </header>

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
              We're working hard to create fair and flexible pricing plans that work for everyone. 
              For now, enjoy full access to trylists.app completely free.
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
                During our early testing phase, everything is completely free. No limits, no restrictions.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Free Early Access</h3>
                  <p className="text-muted-foreground">Full access during testing phase</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">$0</div>
                  <div className="text-sm text-muted-foreground">Limited time</div>
                </div>
              </div>

              <div className="mb-8 grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Unlimited Lists & Tasks</div>
                    <div className="text-sm text-muted-foreground">Create as many lists and tasks as you need</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Full GTD Workflow</div>
                    <div className="text-sm text-muted-foreground">Complete Getting Things Done implementation</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Powerful Search</div>
                    <div className="text-sm text-muted-foreground">Find anything instantly across all your data</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Import & Export</div>
                    <div className="text-sm text-muted-foreground">Bring your data from Nirvana and other tools</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Cloud Sync</div>
                    <div className="text-sm text-muted-foreground">Access your data from anywhere</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">All Future Features</div>
                    <div className="text-sm text-muted-foreground">Get access to new features as we build them</div>
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

      {/* Future Plans Preview */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold">What's Coming</h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                We're designing pricing plans that scale with your needs while keeping the core functionality accessible to everyone.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Free Plan Preview */}
              <div className="rounded-lg border bg-background p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">Free</h3>
                  <p className="text-muted-foreground">Perfect for personal use</p>
                </div>
                <div className="mb-6">
                  <div className="text-3xl font-bold">$0</div>
                  <div className="text-sm text-muted-foreground">Forever</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Up to 1,000 tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Full GTD workflow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Basic search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Import/Export</span>
                  </div>
                </div>
              </div>

              {/* Pro Plan Preview */}
              <div className="relative rounded-lg border-2 border-primary bg-background p-6 shadow-lg">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold">Pro</h3>
                  <p className="text-muted-foreground">For power users and teams</p>
                </div>
                <div className="mb-6">
                  <div className="text-3xl font-bold">$8</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Unlimited tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Advanced search & filters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Team collaboration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">API access</span>
                  </div>
                </div>
              </div>

              {/* Enterprise Plan Preview */}
              <div className="rounded-lg border bg-background p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">Enterprise</h3>
                  <p className="text-muted-foreground">For large organizations</p>
                </div>
                <div className="mb-6">
                  <div className="text-3xl font-bold">Custom</div>
                  <div className="text-sm text-muted-foreground">Contact us</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Self-hosted option</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Custom integrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Dedicated support</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold">Stay Updated</h3>
              <p className="mb-4 text-muted-foreground">
                Want to know when pricing plans launch? We'll send you an email when they're ready.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/sign-in")}
              >
                Sign Up for Updates
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30 py-20">
        <Container>
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="mb-2 text-lg font-semibold">When will pricing plans be available?</h3>
                <p className="text-muted-foreground">
                  We're planning to launch our pricing plans in Q4 2025. Until then, everyone gets full access to trylists.app for free.
                </p>
              </div>
              
              <div>
                <h3 className="mb-2 text-lg font-semibold">Will there always be a free plan?</h3>
                <p className="text-muted-foreground">
                  Yes! We believe in keeping the core productivity features accessible to everyone. There will always be a generous free tier.
                </p>
              </div>
              
              <div>
                <h3 className="mb-2 text-lg font-semibold">What happens to my data when pricing launches?</h3>
                <p className="text-muted-foreground">
                  Your data is yours forever. Early users will get special pricing considerations, and you'll have plenty of time to choose the plan that works for you.
                </p>
              </div>
              
              <div>
                <h3 className="mb-2 text-lg font-semibold">Can I influence the pricing plans?</h3>
                <p className="text-muted-foreground">
                  Absolutely! We'd love your feedback on what features matter most to you and how we can structure plans that work for everyone. 
                  <a href="mailto:hello@trylists.app" className="ml-1 text-primary underline">
                    Send us your thoughts
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <Star className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="mb-4 text-3xl font-bold">Start Building Your System Today</h2>
            <p className="mb-8 text-xl text-muted-foreground">
              Join the early testing phase and help shape the future of trylists.app while enjoying full access for free.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/sign-in")}
              className="px-8 py-3 text-lg"
            >
              Get Started Free
            </Button>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <Container>
          <div className="flex flex-col items-center justify-between sm:flex-row">
            <div className="mb-4 flex items-center gap-2 sm:mb-0">
              <Logo width={24} height={24} />
              <span className="font-semibold">trylists.app</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/trylists"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
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
              <p className="text-sm text-muted-foreground">
                © 2025 trylists.app. Built for productivity enthusiasts.
              </p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
