import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function Groups() {
  const { groupId } = useParams();
  const { t } = useLanguage();

  const getGroupTitle = () => {
    switch (groupId) {
      case "test1":
        return "Test Group 1";
      case "test2":
        return "Test Group 2";
      case "test3":
        return "Test Group 3";
      default:
        return "Unknown Group";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      
      <main className="pt-4 pl-6 pr-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border border-border shadow-card p-8">
            <h1 className="text-3xl font-bold text-primary mb-4">
              {getGroupTitle()}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("groups.welcome").replace("{groupName}", getGroupTitle())}
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                <h3 className="font-semibold text-lg mb-2">{t("groups.analytics")}</h3>
                <p className="text-muted-foreground">{t("groups.analyticsDesc")}</p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                <h3 className="font-semibold text-lg mb-2">{t("groups.members")}</h3>
                <p className="text-muted-foreground">{t("groups.membersDesc")}</p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                <h3 className="font-semibold text-lg mb-2">{t("groups.settings")}</h3>
                <p className="text-muted-foreground">{t("groups.settingsDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}