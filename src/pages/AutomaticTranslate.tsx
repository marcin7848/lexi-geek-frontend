import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Info } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Category } from "@/types/category";
import { categoryService } from "@/services/categoryService";
import { languageService } from "@/services/languageService";
import { toast } from "sonner";
import { authStateService } from "@/services/authStateService";

const AutomaticTranslate = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [sourcePart, setSourcePart] = useState<"QUESTION" | "ANSWER">("QUESTION");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const categoryName = category?.name || "Unknown Category";

  useEffect(() => {
    const loadCategory = async () => {
      // Initialize auth state to verify authentication
      const user = await authStateService.initialize();
      if (!user) {
        navigate("/login");
        return;
      }

      if (!categoryId) return;

      try {
        // Find category from all languages
        const languages = await languageService.getAll();

        let foundCategory: Category | null = null;
        let foundLanguageId: string | null = null;

        for (const language of languages) {
          const categories = await categoryService.getAll(language.id);
          const found = categories.find((cat) => cat.uuid === categoryId);

          if (found) {
            foundCategory = found;
            foundLanguageId = language.id;
            setCategory(found);
            setLanguageId(language.id);
            break;
          }
        }

        if (!foundCategory || !foundLanguageId) {
          toast.error(t("autoTranslate.categoryNotFound"));
        }
      } catch (error) {
        console.error("Error loading category:", error);
        toast.error(t("autoTranslate.errorLoad"));
      }
    };

    loadCategory();
  }, [categoryId, t]);

  const handleAutoTranslate = async () => {
    if (!languageId || !categoryId) {
      toast.error(t("autoTranslate.errorMissingData"));
      return;
    }

    if (!text.trim()) {
      toast.error(t("autoTranslate.errorEmptyText"));
      return;
    }

    if (!sourceLanguage.trim() || !targetLanguage.trim()) {
      toast.error(t("autoTranslate.errorMissingLanguages"));
      return;
    }

    setIsLoading(true);

    try {
      await categoryService.automaticTranslation(languageId, categoryId, {
        sourceLanguage,
        targetLanguage,
        sourcePart,
        text,
      });

      toast.success(t("autoTranslate.success"));
      navigate(`/category/${categoryId}`);
    } catch (error) {
      console.error("Error performing automatic translation:", error);
      toast.error(t("autoTranslate.errorTranslation"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-[95%] mx-auto">
        <div className="py-8 space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/category/${categoryId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("autoTranslate.backToCategory")}
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">{t("autoTranslate.title")}</h1>
            <p className="text-muted-foreground">{t("autoTranslate.category")} {categoryName}</p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 max-w-[200px] space-y-2">
                <Label htmlFor="sourceLanguage">{t("autoTranslate.sourceLanguage")}</Label>
                <Input
                  id="sourceLanguage"
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  placeholder={t("autoTranslate.sourceLanguagePlaceholder")}
                />
              </div>

              <div className="flex-1 max-w-[200px] space-y-2">
                <Label htmlFor="targetLanguage">{t("autoTranslate.targetLanguage")}</Label>
                <Input
                  id="targetLanguage"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  placeholder={t("autoTranslate.targetLanguagePlaceholder")}
                />
              </div>

              <div className="flex-1 max-w-[200px] space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="sourcePart">{t("autoTranslate.sourcePart")}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{t("autoTranslate.sourcePartTooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={sourcePart} onValueChange={(value) => setSourcePart(value as "QUESTION" | "ANSWER")}>
                  <SelectTrigger id="sourcePart">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUESTION">{t("autoTranslate.question")}</SelectItem>
                    <SelectItem value="ANSWER">{t("autoTranslate.answer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">{t("autoTranslate.textToTranslate")}</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("autoTranslate.placeholder")}
                className="min-h-[300px] resize-y"
              />
            </div>

            <Button onClick={handleAutoTranslate} disabled={isLoading}>
              {isLoading ? t("autoTranslate.translating") : t("autoTranslate.button")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AutomaticTranslate;
