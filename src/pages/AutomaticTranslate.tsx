import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { mockCategories } from "@/data/mockCategories";
import { useLanguage } from "@/i18n/LanguageProvider";

const AutomaticTranslate = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [method, setMethod] = useState("GOOGLE_TRANSLATOR");
  const [text, setText] = useState("");

  const category = mockCategories.find(cat => cat.id === Number(categoryId));
  const categoryName = category?.name || "Unknown Category";

  const handleAutoTranslate = () => {
    // Currently just redirects back to category page
    navigate(`/category/${categoryId}`);
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
            <div className="space-y-2">
              <Label htmlFor="method">{t("autoTranslate.method")}</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="method">
                  <SelectValue placeholder={t("autoTranslate.selectMethod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOGLE_TRANSLATOR">{t("autoTranslate.googleTranslator")}</SelectItem>
                </SelectContent>
              </Select>
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

            <Button onClick={handleAutoTranslate}>
              {t("autoTranslate.button")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AutomaticTranslate;
