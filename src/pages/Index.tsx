import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, type AuthUser } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

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

    // Listen for storage changes (logout events)
    const handleStorageChange = () => {
      if (!checkMockedSession()) {
        setUser(null);
        setLoading(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    if (checkMockedSession()) {
      return () => window.removeEventListener('storage', handleStorageChange);
    }

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

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
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
                      {t("dashboard.yourDashboard")}
                    </h1>
                    <p className="text-xl text-muted-foreground animate-fade-in">
                      {t("dashboard.welcomeBack").replace("{username}", user.user_metadata?.username || user.email?.split('@')[0] || '')}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">{t("dashboard.recentActivity")}</CardTitle>
                        <CardDescription>
                          {t("dashboard.recentActivityDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {t("dashboard.recentActivityText")}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">{t("dashboard.studyGoals")}</CardTitle>
                        <CardDescription>
                          {t("dashboard.studyGoalsDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {t("dashboard.studyGoalsText")}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">{t("dashboard.achievements")}</CardTitle>
                        <CardDescription>
                          {t("dashboard.achievementsDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {t("dashboard.achievementsText")}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-primary mb-4 animate-fade-in">
                      {t("dashboard.welcome")}
                    </h1>
                    <p className="text-xl text-muted-foreground animate-fade-in">
                      {t("dashboard.welcomeDesc")}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">{t("dashboard.quickStart")}</CardTitle>
                        <CardDescription>
                          {t("dashboard.quickStartDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {t("dashboard.quickStartText")}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">{t("dashboard.groups")}</CardTitle>
                        <CardDescription>
                          {t("dashboard.groupsDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {t("dashboard.groupsText")}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-border/50">
                      <CardHeader>
                        <CardTitle className="text-primary">{t("dashboard.yourProgress")}</CardTitle>
                        <CardDescription>
                          {t("dashboard.yourProgressDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {t("dashboard.yourProgressText")}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-12 text-center">
                    <Card className="max-w-md mx-auto shadow-card border border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-primary">{t("dashboard.readyToBegin")}</CardTitle>
                        <CardDescription>
                          {t("dashboard.readyToBeginDesc")}
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
