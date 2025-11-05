import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Home, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/supabase";
import { useLanguage } from "@/i18n/LanguageProvider";
import { authStateService } from "@/services/authStateService";
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
    // Get auth state from centralized service (no API call if already initialized)
    const currentUser = authStateService.getCurrentUser();
    setUser(currentUser as AuthUser);

    // Track if languages have been loaded to prevent duplicate calls
    let languagesLoaded = false;
    let previousUserId = currentUser?.id || null;

    // Load languages initially if user is authenticated
    const isAuthPage = () => {
      return location.pathname === '/login' || location.pathname === '/register';
    };

    const loadLanguagesOnce = async () => {
      if (languagesLoaded) return;
      languagesLoaded = true;
      await loadLanguages();
    };

    if (currentUser && !isAuthPage()) {
      loadLanguagesOnce();
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

    const unsubscribe = authStateService.subscribe((newUser) => {
      const newUserId = newUser?.id || null;

      // Only react to actual user changes (different user ID)
      if (previousUserId === newUserId) {
        return;
      }

      previousUserId = newUserId;
      setUser(newUser as AuthUser);

      if (!newUser) {
        setLanguages([]);
        languagesLoaded = false;
        redirectToHome();
      } else if (!isAuthPage()) {
        loadLanguagesOnce();
      }
    });

    const handleAuthStorageChange = () => {
      const u = authStateService.getCurrentUser();
      setUser(u as AuthUser);
      if (!u) {
        setLanguages([]);
        redirectToHome();
      }
    };

    window.addEventListener('storage', handleAuthStorageChange);


    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleAuthStorageChange);
    };
  }, []);

  const loadLanguages = async () => {
    try {
      const langs = await languageService.getLanguages(
        undefined,
        { singlePage: true }
      );
      setLanguages(langs);
    } catch (e) {
      console.error('Error fetching languages for sidebar', e);
    }
  };


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