import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { CategoryTree } from "@/components/CategoryTree";
import { Category } from "@/types/category";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StartRepeatingModal from "@/components/StartRepeatingModal";
import { repeatService, type RepeatSession } from "@/services/repeatService";
import { languageService, type Language } from "@/services/languageService";
import { categoryService } from "@/services/categoryService";
import { useLanguage } from "@/i18n/LanguageProvider";


export default function LanguageView() {
  const { languageId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [language, setLanguage] = useState<Language | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [repeatSession, setRepeatSession] = useState<RepeatSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!languageId) return;
      
      try {
        // Check if languageId is a numeric index (e.g., "1", "2", "3")
        const isNumericIndex = /^\d+$/.test(languageId);
        let languageUuid: string;
        let found: Language | null = null;

        if (isNumericIndex) {
          // Convert numeric index to UUID by fetching all languages
          const allLanguages = await languageService.getAll();
          const index = parseInt(languageId) - 1; // Convert to 0-based index

          if (index >= 0 && index < allLanguages.length) {
            found = allLanguages[index];
            languageUuid = found.id; // This is the UUID
          } else {
            toast.error(t("addLanguage.notFound"));
            navigate("/");
            return;
          }
        } else {
          // languageId is already a UUID
          found = await languageService.getById(languageId);
          languageUuid = languageId;
        }

        if (found) {
          setLanguage(found);

          // Load categories from backend using UUID
          const categories = await categoryService.getAll(languageUuid);
          setCategories(categories);

          // Load repeat session from backend
          const session = await repeatService.getActiveSession(languageUuid);
          setRepeatSession(session);
        } else {
          toast.error(t("addLanguage.notFound"));
          navigate("/");
        }
      } catch (error) {
        console.error("Error loading language data:", error);
        toast.error(t("common.error"));
      }
    };
    
    loadData();
  }, [languageId, navigate, t]);

  const handleCategoriesUpdate = async () => {
    // Reload categories from backend
    if (languageId && language) {
      try {
        // Use the language.id which contains the UUID
        const categories = await categoryService.getAll(language.id);
        setCategories(categories);
      } catch (error) {
        console.error("Error reloading categories:", error);
        toast.error(t("common.error"));
      }
    }
  };

  const handleStartRepeating = () => {
    if (repeatSession) {
      navigate(`/language/${languageId}/repeat`);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleResetRepeating = async () => {
    if (!language) return;

    try {
      await repeatService.resetSession(language.id);
      setRepeatSession(null);
      toast.success(t("languageView.successReset"));
    } catch (error) {
      console.error("Error resetting repeat session:", error);
      toast.error(t("common.error"));
    }
  };

  const handleStartRepeatSubmit = async (data: {
    categoryUuids: string[];
    includeChosen: boolean;
    wordCount: number;
    method: string;
  }) => {
    if (!language) return;

    try {
      // Start repeat session with backend
      const session = await repeatService.startRepeat(language.id, {
        categoryUuids: data.categoryUuids,
        includeChosen: data.includeChosen,
        wordCount: data.wordCount,
        method: data.method,
      });

      setRepeatSession(session);
      setIsModalOpen(false);
      navigate(`/language/${languageId}/repeat`);
    } catch (error) {
      console.error("Error starting repeat session:", error);
      toast.error(t("common.error"));
    }
  };

  if (!language) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-[95%] mx-auto">
        <div className="py-8 space-y-6">
          <h1 className="text-3xl font-bold">{language.name}</h1>
          
          <div className="flex items-center gap-4">
            <Button onClick={handleStartRepeating} size="lg">
              {repeatSession ? t("languageView.backToRepeating") : t("languageView.startRepeating")}
            </Button>
            {repeatSession && (
              <>
                <span className="text-lg">{t("languageView.wordsLeft").replace("{count}", String(repeatSession.wordsLeft))}</span>
                <Button onClick={handleResetRepeating} variant="outline">
                  {t("languageView.resetRepeating")}
                </Button>
              </>
            )}
          </div>

          <CategoryTree categories={categories} languageId={language.id} onUpdate={handleCategoriesUpdate} />
        </div>
      </main>
      
      <StartRepeatingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        categories={categories}
        onStart={handleStartRepeatSubmit}
      />
    </div>
  );
}
