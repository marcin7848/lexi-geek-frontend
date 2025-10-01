import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { supabase, type AuthUser } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";

export const Header = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

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

  const handleLogout = async () => {
    try {
      // Clear mocked session if exists
      localStorage.removeItem('supabase.auth.token');
      
      await supabase.auth.signOut();
      setUser(null);
      
      // Trigger storage event to notify other components
      window.dispatchEvent(new Event('storage'));
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
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

        {/* Theme Toggle & Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:bg-accent/10"
          >
            <Lightbulb className="h-5 w-5" />
          </Button>

          {loading ? (
            <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <>
              <span className="text-foreground/80">
                Hi, {getDisplayName()}!
              </span>
              <Button variant="header" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="header" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="auth" size="sm">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};