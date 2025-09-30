import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, type AuthUser } from "@/lib/supabase";

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mocked session first
    const checkMockedSession = () => {
      const mockedSession = localStorage.getItem('supabase.auth.token');
      if (mockedSession) {
        try {
          const parsed = JSON.parse(mockedSession);
          if (parsed.currentSession?.user) {
            setUser(parsed.currentSession.user as AuthUser);
            setLoading(false);
            return true;
          }
        } catch (e) {
          // Invalid mocked session, continue to real auth
        }
      }
      return false;
    };

    if (checkMockedSession()) return;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user as AuthUser | null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as AuthUser | null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      
      <main className="pt-4 pl-6 pr-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-64 mb-4"></div>
                <div className="h-4 bg-muted rounded w-96"></div>
              </div>
            </div>
          ) : (
            <>
              {user ? (
                <>
                  <div className="mb-8">
                    <h1 className="text-4xl font-bold text-primary mb-4 animate-fade-in">
                      Your Dashboard
                    </h1>
                    <p className="text-xl text-muted-foreground animate-fade-in">
                      Welcome back, {user.user_metadata?.username || user.email?.split('@')[0]}! Here's your learning overview.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">Recent Activity</CardTitle>
                        <CardDescription>
                          Your latest learning sessions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Continue where you left off and keep up the momentum.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">Study Goals</CardTitle>
                        <CardDescription>
                          Track your learning objectives
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Set and achieve your personalized learning targets.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">Achievements</CardTitle>
                        <CardDescription>
                          Your learning milestones
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Celebrate your progress and earned badges.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-primary mb-4 animate-fade-in">
                      Welcome to LexiGeek
                    </h1>
                    <p className="text-xl text-muted-foreground animate-fade-in">
                      Your ultimate learning and exploration platform
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">Quick Start</CardTitle>
                        <CardDescription>
                          Get started with the basics and explore key features
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Navigate through the sidebar to access different sections and start your learning journey.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">Groups</CardTitle>
                        <CardDescription>
                          Collaborate and learn with organized groups
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Join study groups, share knowledge, and participate in collaborative learning experiences.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">Your Progress</CardTitle>
                        <CardDescription>
                          Track your learning achievements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Monitor your progress, set goals, and celebrate your learning milestones.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-12 text-center">
                    <Card className="max-w-md mx-auto shadow-card border border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-primary">Ready to Begin?</CardTitle>
                        <CardDescription>
                          Create an account or sign in to unlock the full LexiGeek experience
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
