import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SiteLayout } from "@/site/site-layout";
import {
  CheckCircle,
  Search,
  Lightbulb,
  Archive,
  Database,
  Code,
  Mail,
  Gauge,
  Sparkles,
} from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // No automatic redirect - let users stay on landing page if they want

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
                onClick={() => navigate(user ? "/app" : "/sign-in")}
                className="px-8 py-3 text-lg"
              >
                {user ? "Open App" : "Get Started Free"}
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
                <Sparkles className="h-6 w-6 text-primary" />
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
                onClick={() => navigate(user ? "/app" : "/sign-in")}
                className="px-8 py-3 text-lg"
              >
                {user ? "Open App" : "Import from Nirvana"}
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
              onClick={() => navigate(user ? "/app" : "/sign-in")}
              className="px-8 py-3 text-lg"
            >
              {user ? "Open App" : "Start Your Free Account"}
            </Button>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
