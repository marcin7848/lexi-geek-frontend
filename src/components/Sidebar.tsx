import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Home, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { AuthUser } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";
import { authService } from "@/services/authService";
import { languageService, type Language } from "@/services/languageService";


export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    // Attempt to initialize from backend account and mirror to localStorage
    (async () => {
      const serverUser = await authService.initializeFromAccount();
      if (serverUser) {
        setUser(serverUser as AuthUser);
        return;
      }

      // Helper: redirect to home when becoming unauthenticated
      const isPublicAuthRoute = (path: string) => path === '/login' || path === '/register';
      const redirectToHome = () => {
        // Do not redirect if user is already on a public auth route
        if (isPublicAuthRoute(location.pathname)) {
          return;
        }
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      };

      // Check for mocked session first
      const checkMockedSession = () => {
        const u = authService.getCurrentUser();
        if (u) {
          setUser(u as AuthUser);
          return true;
        }
        return false;
      };

      // Listen for storage changes (login/logout events)
      const handleAuthStorageChange = () => {
        if (!checkMockedSession()) {
          setUser(null);
          // If storage says user cleared (logout from another tab), redirect to home
          redirectToHome();
        }
      };

      window.addEventListener('storage', handleAuthStorageChange);

      if (checkMockedSession()) {
        return () => window.removeEventListener('storage', handleAuthStorageChange);
      }

      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user as AuthUser | null);
          if (!session?.user) {
            // User just logged out or session expired
            redirectToHome();
          }
        }
      );

      // Check for existing session (initial load) — do not redirect here to avoid hijacking public pages
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user as AuthUser | null);
      });

      return () => {
        subscription.unsubscribe();
        window.removeEventListener('storage', handleAuthStorageChange);
      };
    })();
  }, []);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const langs = await languageService.getLanguages(
          undefined,
          { sort: 'name', order: 'desc', singlePage: true }
        );
        setLanguages(langs);
      } catch (e) {
        console.error('Error fetching languages for sidebar', e);
      }
    };

    loadLanguages();
  }, []);

  return (
    <>
      {/* Sidebar Toggle Button - Always visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-20 left-4 z-50 bg-card border border-border shadow-card"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
        )}
      >
        <div className={cn("pt-32 px-4", !isOpen && "hidden")}>
          {/* Home Link */}
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors mb-2",
              isActive("/") 
                ? "bg-sidebar-accent text-sidebar-primary font-medium" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Home className="h-4 w-4" />
            <span>{t("sidebar.home")}</span>
          </Link>

          {/* Languages Section - Only visible for logged-in users */}
          {user && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sidebar-foreground font-medium">{t("sidebar.languages")}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/add-language")}
                  className="h-6 w-6"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-px bg-sidebar-border mx-3 mb-2" />

              {/* Languages List */}
              <div className="space-y-1">
                {languages.map((language, idx) => (
                  <div
                    key={language.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm group",
                      isActive(`/language/${idx + 1}`)
                        ? "bg-sidebar-accent text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30"
                    )}
                  >
                    <Link
                      to={`/language/${idx + 1}`}
                      onClick={() => setIsOpen(false)}
                      className="flex-1"
                    >
                      {language.shortcut}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/language/${idx + 1}/edit`);
                        setIsOpen(false);
                      }}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for click outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};