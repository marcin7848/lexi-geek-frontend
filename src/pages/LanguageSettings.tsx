import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShortcutHints } from "@/components/ShortcutHints";
import { useLanguage } from "@/i18n/LanguageProvider";

type Language = {
  id: string;
  name: string;
  shortcut: string;
  hidden: boolean;
  codeForTranslator: string;
  codeForSpeech: string;
  specialLetters?: string;
};

export default function LanguageSettings() {
  const { languageId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [language, setLanguage] = useState<Language | null>(null);
  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const shortcutInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    const found = languages.find((lang: Language) => lang.id === languageId);
    
    if (found) {
      setLanguage(found);
    } else {
      toast.error(t("addLanguage.notFound"));
      navigate("/");
    }
  }, [languageId, navigate, t]);

  const validateForm = () => {
    if (!language) return false;
    
    const newErrors: Record<string, string> = {};

    if (language.name.length < 3) {
      newErrors.name = t("addLanguage.errorNameShort");
    } else if (language.name.length > 64) {
      newErrors.name = t("addLanguage.errorNameLong");
    }

    if (language.shortcut.length < 2) {
      newErrors.shortcut = t("addLanguage.errorShortcutShort");
    }

    if (language.codeForTranslator && language.codeForTranslator.length < 2) {
      newErrors.codeForTranslator = t("addLanguage.errorTranslatorShort");
    } else if (language.codeForTranslator && language.codeForTranslator.length > 15) {
      newErrors.codeForTranslator = t("addLanguage.errorTranslatorLong");
    }

    if (language.codeForSpeech && language.codeForSpeech.length < 2) {
      newErrors.codeForSpeech = t("addLanguage.errorSpeechShort");
    } else if (language.codeForSpeech && language.codeForSpeech.length > 15) {
      newErrors.codeForSpeech = t("addLanguage.errorSpeechLong");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("addLanguage.errorValidation"));
      return;
    }

    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    const updatedLanguages = languages.map((lang: Language) =>
      lang.id === languageId ? language : lang
    );

    localStorage.setItem("languages", JSON.stringify(updatedLanguages));
    toast.success(t("addLanguage.successUpdate"));
  };

  const handleDelete = () => {
    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    const filteredLanguages = languages.filter((lang: Language) => lang.id !== languageId);
    
    localStorage.setItem("languages", JSON.stringify(filteredLanguages));
    toast.success(t("addLanguage.successDelete"));
    navigate("/");
  };

  if (!language) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-2xl mx-auto">
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-6">{t("addLanguage.titleEdit").replace("{name}", language.name)}</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("addLanguage.name")} *</Label>
              <Input
                id="name"
                value={language.name}
                onChange={(e) => setLanguage({ ...language, name: e.target.value })}
                placeholder={t("addLanguage.namePlaceholder")}
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="shortcut">{t("addLanguage.shortcut")} *</Label>
              <Input
                id="shortcut"
                ref={shortcutInputRef}
                value={language.shortcut}
                onChange={(e) => setLanguage({ ...language, shortcut: e.target.value })}
                onFocus={() => setShowShortcutHints(true)}
                placeholder={t("addLanguage.shortcutPlaceholder")}
                required
              />
              {showShortcutHints && (
                <ShortcutHints
                  value={language.shortcut}
                  onSelect={(shortcut) => {
                    setLanguage({ ...language, shortcut });
                    setShowShortcutHints(false);
                  }}
                  onHide={() => setShowShortcutHints(false)}
                  inputRef={shortcutInputRef}
                />
              )}
              {errors.shortcut && <p className="text-sm text-destructive">{errors.shortcut}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hidden"
                checked={language.hidden}
                onCheckedChange={(checked) => 
                  setLanguage({ ...language, hidden: checked as boolean })
                }
              />
              <Label htmlFor="hidden" className="cursor-pointer">{t("addLanguage.hidden")}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeForTranslator">{t("addLanguage.codeForTranslator")}</Label>
              <Input
                id="codeForTranslator"
                value={language.codeForTranslator}
                onChange={(e) => setLanguage({ ...language, codeForTranslator: e.target.value })}
                placeholder={t("addLanguage.codeForTranslatorPlaceholder")}
              />
              {errors.codeForTranslator && (
                <p className="text-sm text-destructive">{errors.codeForTranslator}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeForSpeech">{t("addLanguage.codeForSpeech")}</Label>
              <Input
                id="codeForSpeech"
                value={language.codeForSpeech}
                onChange={(e) => setLanguage({ ...language, codeForSpeech: e.target.value })}
                placeholder={t("addLanguage.codeForSpeechPlaceholder")}
              />
              {errors.codeForSpeech && (
                <p className="text-sm text-destructive">{errors.codeForSpeech}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialLetters">{t("addLanguage.specialLetters")}</Label>
              <Input
                id="specialLetters"
                value={language.specialLetters || ""}
                onChange={(e) => setLanguage({ ...language, specialLetters: e.target.value })}
                placeholder={t("addLanguage.specialLettersPlaceholder")}
              />
              <p className="text-sm text-muted-foreground">{t("addLanguage.specialLettersHint")}</p>
            </div>

            <div className="flex gap-4">
              <Button type="submit">{t("addLanguage.saveButton")}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                {t("common.cancel")}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    {t("addLanguage.deleteButton")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("addLanguage.deleteConfirm")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("addLanguage.deleteDesc").replace("{name}", language.name)}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>{t("addLanguage.deleteButton")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
