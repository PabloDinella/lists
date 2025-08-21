import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CheckCircle, Search, Lightbulb, Archive, Tag } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center">
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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Logo width={32} height={32} />
              <span className="text-xl font-bold">trylists.app</span>
            </div>
            <Button onClick={() => navigate("/sign-in")}>
              Sign In
            </Button>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <Logo width={80} height={80} />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Organize Your Life with{" "}
              <span className="text-primary">Hierarchical Lists</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A powerful GTD-inspired productivity system that helps you capture, organize, and process everything on your mind into actionable lists.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/sign-in")}
                className="text-lg px-8 py-3"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-3"
              >
                Learn More
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Stay Organized</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built on proven GTD methodology with modern features for today's productivity needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">GTD Processing</h3>
              <p className="text-muted-foreground">
                Built-in GTD workflow helps you quickly process tasks into Next Actions, Waiting For, Scheduled, and Someday/Maybe lists.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Powerful Search</h3>
              <p className="text-muted-foreground">
                Find anything instantly with full-text search across all your lists and items. Use Cmd/Ctrl + / for quick access.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Organization</h3>
              <p className="text-muted-foreground">
                Hierarchical structure lets you organize lists within lists, creating the perfect system for your workflow.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Tagging</h3>
              <p className="text-muted-foreground">
                Tag and categorize your items with custom tags, making it easy to filter and find related tasks.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Archive className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Archive & History</h3>
              <p className="text-muted-foreground">
                Never lose important information. Archive completed items and maintain a searchable history of everything.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Import & Export</h3>
              <p className="text-muted-foreground">
                Easily import your existing data from CSV files and export your lists whenever you need them.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Organized?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users who have transformed their productivity with trylists.app
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/sign-in")}
              className="text-lg px-8 py-3"
            >
              Start Your Free Account
            </Button>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <Logo width={24} height={24} />
              <span className="font-semibold">trylists.app</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 trylists.app. Built for productivity enthusiasts.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
