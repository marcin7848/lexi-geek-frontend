import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb, Star } from "lucide-react";
import { supabase, type AuthUser } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languageOptions } from "@/i18n/languageConfig";
import { authService } from "@/services/authService";
import { dashboardService } from "@/services/dashboardService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "flag-icons/css/flag-icons.min.css";

export const Header = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    loadUserData();
    
    // Check for mocked session first
    const checkMockedSession = () => {
      const user = authService.getCurrentUser();
      if (user) {
        setUser(user as AuthUser);
        setLoading(false);
        return true;
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

  const loadUserData = async () => {
    const userData = await dashboardService.getUserData();
    setStars(userData.stars);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      await supabase.auth.signOut();
      setUser(null);
      
      toast({
        title: t("header.logoutSuccess"),
        description: t("header.logoutSuccessDesc"),
      });
      navigate("/");
    } catch (error) {
      toast({
        title: t("header.logoutError"),
        description: t("header.logoutErrorDesc"),
        variant: "destructive",
      });
    }
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.username) {
      return user.user_metadata.username;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <header className="bg-gradient-header border-b border-border/20 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="text-2xl font-bold text-primary hover:text-primary-glow transition-colors duration-300"
        >
          LexiGeek
        </Link>

        {/* Language Selector, Theme Toggle & Auth Buttons */}
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
            <SelectTrigger className="w-[140px] border-border/20 bg-background/50 hover:bg-accent/10">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span className={`fi fi-${languageOptions.find(lang => lang.code === language)?.countryCode} text-lg`}></span>
                  <span className="text-sm">
                    {languageOptions.find(lang => lang.code === language)?.name}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span className={`fi fi-${lang.countryCode} text-lg`}></span>
                    <span>{lang.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:bg-accent/10"
          >
            <Lightbulb className={`h-7 w-7 ${theme === "light" ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </Button>

          {loading ? (
            <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <>
              <div className="flex items-center gap-2 text-amber-500 font-semibold">
                <Star className="w-5 h-5 fill-current" />
                <span>{stars}</span>
              </div>
              <span className="text-foreground/80">
                {t("header.greeting")}, {getDisplayName()}!
              </span>
              <Button variant="header" size="sm" onClick={handleLogout}>
                {t("header.logout")}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="header" size="sm">
                  {t("header.login")}
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="auth" size="sm">
                  {t("header.register")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};