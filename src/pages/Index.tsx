import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { supabase, type AuthUser } from "@/lib/supabase";
import { authService } from "@/services/authService";
import { dashboardService } from "@/services/dashboardService";
import { RecentActivitySection } from "@/components/dashboard/RecentActivity";
import { DailyTasks } from "@/components/dashboard/DailyTasks";
import { StatisticsChart } from "@/components/dashboard/StatisticsChart";
import { Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    loadUserData();

    // Initialize from backend account if authenticated
    (async () => {
      const serverUser = await authService.initializeFromAccount();
      if (serverUser) {
        setUser(serverUser as AuthUser);
        setLoading(false);
      }

      // Check for mocked session first
      const checkMockedSession = () => {
        const u = authService.getCurrentUser();
        if (u) {
          setUser(u as AuthUser);
          setLoading(false);
          return true;
        }
        return false;
      };

      // Listen for storage changes (logout/login events)
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
    })();
  }, []);

  const loadUserData = async () => {
    const userData = await dashboardService.getUserData();
    setStars(userData.stars);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      
      <main className="pt-4 pl-6 pr-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-64 mb-4"></div>
                <div className="h-4 bg-muted rounded w-96"></div>
              </div>
            </div>
          ) : user ? (
            <>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-primary mb-2 animate-fade-in">
                    {t("dashboard.yourDashboard")}
                  </h1>
                  <p className="text-xl text-muted-foreground animate-fade-in">
                    {t("dashboard.welcomeBack", { username: (user.user_metadata?.username || user.email?.split('@')[0] || "") as string })}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-amber-500 text-2xl font-bold">
                  <Star className="w-8 h-8 fill-current" />
                  <span>{stars}</span>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 mb-6">
                <div className="lg:col-span-1">
                  <RecentActivitySection />
                </div>
                <div className="lg:col-span-2">
                  <DailyTasks onStarsUpdate={loadUserData} />
                </div>
              </div>

              <StatisticsChart />
            </>
          ) : (
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold text-primary mb-4">
                {t("dashboard.welcome")}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t("dashboard.readyToBeginDesc")}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
