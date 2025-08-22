import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  CheckCircle,
  Search,
  Lightbulb,
  Archive,
  Database,
  Zap,
  Code,
  Mail,
  Gauge,
} from "lucide-react";
import { useEffect } from "react";

export function LandingPage() {
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
                onClick={() => navigate("/pricing")}
              >
                Pricing
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
              <Logo width={80} height={80} />
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Free your mind with <br />
              <span className="text-primary">trylists.app</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
              A powerful and flexible productivity tool that doesn't get in your
              way. Primarily designed for GTD practitioners, but entirely
              customizable.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate("/sign-in")}
                className="px-8 py-3 text-lg"
              >
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                Import data from Nirvana
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                Learn More
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <Container>
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Everything You Need to Stay Organized
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Built on proven GTD methodology with modern features for today's
              productivity needs.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="relative rounded-lg border bg-background p-6 shadow-sm">
              <span className="absolute right-4 top-4 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                Under Construction
              </span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">GTD Processing</h3>
              <p className="text-muted-foreground">
                Built-in GTD workflow helps you quickly process tasks into Next
                Actions, Waiting For, Scheduled, and Someday/Maybe lists.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Powerful Search</h3>
              <p className="text-muted-foreground">
                Find anything instantly with full-text search across all your
                lists and items. Use Cmd/Ctrl + / for quick access.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Flexible Lists</h3>
              <p className="text-muted-foreground">
                In trylists.app, everything is a node in a graph. Create and
                connect nodes to represent your lists, tasks, ideas, tags, and
                projects. Or just use the default GTD setup.
              </p>
            </div>

            <div className="relative rounded-lg border bg-background p-6 shadow-sm">
              <span className="absolute right-4 top-4 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                Roadmap
              </span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Local first</h3>
              <p className="text-muted-foreground">
                Your data is stored locally on your device, ensuring privacy and
                quick access. Sync with the cloud only when you need to.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Archive className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Archive & History</h3>
              <p className="text-muted-foreground">
                Never lose important information. Archive completed items and
                maintain a searchable history of everything.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Import & Export</h3>
              <p className="text-muted-foreground">
                Import your existing data from Nirvana, and export your lists
                whenever you need them. More importers coming soon.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Open Source</h3>
              <p className="text-muted-foreground">
                Fully open source and transparent. Contribute, customize, or
                self-host. Your productivity tool should be as flexible as your
                workflow.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Gauge className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Fast</h3>
              <p className="text-muted-foreground">
                Built for speed with modern web technologies. Lightning-fast
                search, instant updates, and smooth interactions that keep you
                in flow.
              </p>
            </div>

            <div className="relative rounded-lg border bg-background p-6 shadow-sm">
              <span className="absolute right-4 top-4 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                Roadmap
              </span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Inbox Capture</h3>
              <p className="text-muted-foreground">
                Capture ideas from anywhere with email integration, Telegram
                bot, and browser extension. Never lose a thought again, even
                when away from the app.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Nirvana Migration CTA */}
      <section className="bg-primary/5 py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-2xl font-bold">Coming from Nirvana?</h2>
            <p className="mb-6 text-lg text-muted-foreground">
              Import your existing Nirvana data in seconds and pick up right
              where you left off. No need to start from scratch – bring your
              projects, tasks, and organization with you.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate("/sign-in")}
                className="px-8 py-3 text-lg"
              >
                Import from Nirvana
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                Learn About Import
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to Get Organized?</h2>
            <p className="mb-8 text-xl text-muted-foreground">
              Join a community of doers who get things done without the stress.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/sign-in")}
              className="px-8 py-3 text-lg"
            >
              Start Your Free Account
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
