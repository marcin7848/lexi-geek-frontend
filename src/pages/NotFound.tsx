import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-[95%] mx-auto">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-foreground">{t("notFound.title")}</h1>
            <p className="text-xl text-muted-foreground">{t("notFound.message")}</p>
            <p className="text-sm text-muted-foreground">
              {t("notFound.description")}
            </p>
            <Button onClick={() => navigate("/")} className="mt-4">
              {t("notFound.returnHome")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
