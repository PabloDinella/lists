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
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-3 text-lg"
                asChild
              >
                <a 
                  href="https://trylistsapp.featurebase.app/en/help/articles/4450394-importing-from-nirvana"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Import data from Nirvana (opens in new tab)"
                >
                  Import data from Nirvana
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Demo Section 1: Inbox Capture */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-5 lg:gap-20 items-center">
              <div className="order-2 lg:order-1 lg:col-span-2">
                <h2 className="mb-6 text-3xl font-bold">
                  Capture Ideas Instantly
                </h2>
                <p className="mb-6 text-lg text-muted-foreground">
                  Getting thoughts out of your head is the first step to stress-free productivity. 
                  See how easy it is to quickly capture new items in your inbox and process them later.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Quick capture with keyboard shortcuts
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Add context and details on the fly
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Process inbox items into actionable tasks
                    </p>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 lg:col-span-3">
                {/* Inbox Capture Demo Video */}
                <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '1280/776' }}>
                  <video
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/1_capture_demo.mp4" type="video/mp4" />
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                      <p className="text-muted-foreground">Video not supported</p>
                    </div>
                  </video>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Demo Section 2: Filtering and Organization */}
      <section className="bg-muted/30 py-20">
        <Container>
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-5 lg:gap-20 items-center">
              <div className="lg:col-span-3">
                {/* Filtering Demo Video */}
                <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '1280/776' }}>
                  <video
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/2_filter_demo.mp4" type="video/mp4" />
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                      <p className="text-muted-foreground">Video not supported</p>
                    </div>
                  </video>
                </div>
              </div>
              <div className="lg:col-span-2">
                <h2 className="mb-6 text-3xl font-bold">
                  Find What Matters Most
                </h2>
                <p className="mb-6 text-lg text-muted-foreground">
                  Stay focused on what's important with powerful filtering by area of focus and context. 
                  See only the tasks that matter for your current situation and energy level.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Filter by areas of focus (Work, Personal, Health, etc.)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Use contexts to show tasks by location or tool needed
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Combine filters to create the perfect view for any situation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Demo Section 3: Advanced Search & Quick Navigation */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-5 lg:gap-20 items-center">
              <div className="order-2 lg:order-1 lg:col-span-2">
                <h2 className="mb-6 text-3xl font-bold">
                  Find Anything Instantly
                </h2>
                <p className="mb-6 text-lg text-muted-foreground">
                  Never lose track of important tasks or ideas. Use powerful search and quick navigation 
                  to find what you need in seconds, not minutes.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Global search with Cmd/Ctrl + / shortcut
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Search across all lists, projects, and notes
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Instant results as you type
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Navigate directly to any item with keyboard shortcuts
                    </p>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 lg:col-span-3">
                {/* Search Demo Video */}
                <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '1280/776' }}>
                  <video
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/3_search_demo.mp4" type="video/mp4" />
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                      <p className="text-muted-foreground">Video not supported</p>
                    </div>
                  </video>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Demo Section 4: Custom Lists & Tagging System */}
      <section className="bg-muted/30 py-20">
        <Container>
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-5 lg:gap-20 items-center">
              <div className="lg:col-span-3">
                {/* Custom Lists Demo Video */}
                <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '1280/776' }}>
                  <video
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/4_custom_lists_demo.mp4" type="video/mp4" />
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                      <p className="text-muted-foreground">Video not supported</p>
                    </div>
                  </video>
                </div>
              </div>
              <div className="lg:col-span-2">
                <h2 className="mb-6 text-3xl font-bold">
                  Organize Your Way
                </h2>
                <p className="mb-6 text-lg text-muted-foreground">
                  Go beyond basic task lists. Create custom categories, use flexible tagging, 
                  and build the exact organizational system that fits your workflow.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Create unlimited custom lists and categories
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Use flexible tags to cross-reference items
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Connect related items with the node-based system
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Start with GTD defaults or build from scratch
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20">
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
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-3 text-lg"
                asChild
              >
                <a 
                  href="https://trylistsapp.featurebase.app/en/help/articles/4450394-importing-from-nirvana"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Learn About Import (opens in new tab)"
                >
                  Learn About Import
                </a>
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
