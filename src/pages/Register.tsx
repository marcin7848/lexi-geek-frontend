import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { authService } from "@/services/authService";
import { authStateService } from "@/services/authStateService";
import { useLanguage } from "@/i18n/LanguageProvider";

const registerSchemaFactory = (t: (k: string, ...args: unknown[]) => string) => z.object({
  username: z.string()
    .min(3, t("auth.usernameMin", 3))
    .max(20, t("auth.usernameMax", 20)),
  email: z.string().email(t("auth.invalidEmail")),
  password: z.string().min(6, t("auth.passwordMin", 6)),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t("auth.passwordsMismatch"),
  path: ["confirmPassword"],
});

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    username?: string; 
    email?: string; 
    password?: string; 
    confirmPassword?: string; 
  }>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const registerSchema = useMemo(() => registerSchemaFactory(t as unknown as (k: string, ...args: unknown[]) => string), [t]);

  const validateForm = () => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const user = await authService.register(formData.email, formData.password, formData.username);

      if (user) {
        authStateService.setUser(user);
      }

      toast({
        title: t("auth.registerSuccessTitle") as unknown as string,
        description: t("auth.registerSuccessDesc") as unknown as string,
      });
      
      navigate("/");
    } catch (error) {
      let description: string = t("common.unexpectedError");
      try {
        const { RequestError, buildLocalizedErrorDescription } = await import("@/services/requestError");
        if (error instanceof RequestError) {
          const resolveField = (field: string) => {
            switch (field) {
              case "username":
                return t("auth.username") as unknown as string;
              case "email":
                return t("auth.email") as unknown as string;
              case "password":
                return t("auth.password") as unknown as string;
              default:
                return field;
            }
          };
          description = buildLocalizedErrorDescription(error, t as unknown as (k: string) => string, resolveField);
        } else if (error instanceof Error && error.message) {
          description = error.message;
        }
      } catch (_) {
        if (error instanceof Error && error.message) {
          description = error.message;
        }
      }
      toast({
        title: t("auth.registrationFailed") as unknown as string,
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    toast({
      title: t("auth.oauthNotSupportedTitle") as unknown as string,
      description: t("auth.oauthNotSupportedDesc") as unknown as string,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      
      <main className="pt-8 pl-6 pr-6 flex justify-center">
        <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">{t("auth.registerTitle") as unknown as string}</CardTitle>
          <CardDescription>{t("auth.signUpDescription") as unknown as string}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("auth.username") as unknown as string}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t("auth.usernamePlaceholder") as unknown as string}
                value={formData.username}
                onChange={handleInputChange("username")}
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email") as unknown as string}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder") as unknown as string}
                value={formData.email}
                onChange={handleInputChange("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password") as unknown as string}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.passwordPlaceholder") as unknown as string}
                value={formData.password}
                onChange={handleInputChange("password")}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword") as unknown as string}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("auth.confirmPasswordPlaceholder") as unknown as string}
                value={formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              variant="auth" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (t("auth.creatingAccount") as unknown as string) : (t("auth.registerButton") as unknown as string)}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.orContinueWith") as unknown as string}</span>
            </div>
          </div>
          
          <Button 
            variant="google" 
            className="w-full" 
            onClick={handleGoogleRegister}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("auth.continueWithGoogle") as unknown as string}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.hasAccount") as unknown as string}{" "}
            <Link to="/login" className="text-primary hover:text-primary-glow transition-colors">
              {t("auth.loginLink") as unknown as string}
            </Link>
          </p>
        </CardContent>
      </Card>
      </main>
    </div>
  );
}