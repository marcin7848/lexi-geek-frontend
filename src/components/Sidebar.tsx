import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Home, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { AuthUser } from "@/lib/supabase";

type Language = {
  id: string;
  name: string;
  shortcut: string;
  hidden: boolean;
  codeForTranslator: string;
  codeForSpeech: string;
  specialLetters?: string;
};

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    // Check for mocked session first
    const checkMockedSession = () => {
      const mockedSession = localStorage.getItem('supabase.auth.token');
      if (mockedSession) {
        try {
          const parsed = JSON.parse(mockedSession);
          setUser(parsed as AuthUser);
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    };

    // Listen for storage changes (logout events)
    const handleAuthStorageChange = () => {
      if (!checkMockedSession()) {
        setUser(null);
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
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as AuthUser | null);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleAuthStorageChange);
    };
  }, []);

  useEffect(() => {
    // Initialize with mock data if localStorage is empty
    const storedLanguages = localStorage.getItem("languages");
    if (!storedLanguages) {
      const mockLanguages: Language[] = [
        {
          id: "1",
          name: "English",
          shortcut: "ENG",
          hidden: false,
          codeForTranslator: "en-US",
          codeForSpeech: "en-US",
          specialLetters: "",
        },
        {
          id: "2",
          name: "Deutsch",
          shortcut: "DEU",
          hidden: false,
          codeForTranslator: "de",
          codeForSpeech: "de",
          specialLetters: "ä,Ä,ö,Ö,ü,Ü,ß",
        },
        {
          id: "3",
          name: "Java",
          shortcut: "JAVA",
          hidden: false,
          codeForTranslator: "",
          codeForSpeech: "",
          specialLetters: "",
        },
      ];
      localStorage.setItem("languages", JSON.stringify(mockLanguages));
      setLanguages(mockLanguages);
    } else {
      setLanguages(JSON.parse(storedLanguages));
    }

    // Listen for storage changes to update the list
    const handleStorageChange = () => {
      const updated = localStorage.getItem("languages");
      if (updated) {
        setLanguages(JSON.parse(updated));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
            <span>Home</span>
          </Link>

          {/* Languages Section - Only visible for logged-in users */}
          {user && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sidebar-foreground font-medium">Languages</span>
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
                {languages.map((language) => (
                  <div
                    key={language.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm group",
                      isActive(`/language/${language.id}`)
                        ? "bg-sidebar-accent text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30"
                    )}
                  >
                    <Link
                      to={`/language/${language.id}`}
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
                        navigate(`/language/${language.id}/edit`);
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