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
import { languageService, type Language, type LanguageForm } from "@/services/languageService";
import { RequestError, buildLocalizedErrorDescription } from "@/services/requestError";
import { authStateService } from "@/services/authStateService";

export default function LanguageSettings() {
  const { languageId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [language, setLanguage] = useState<Language | null>(null);
  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const shortcutInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      // Initialize auth state to verify authentication
      const user = await authStateService.initialize();
      if (!user) {
        navigate("/login");
        return;
      }

      if (!languageId) {
        toast.error(t("addLanguage.notFound"));
        navigate("/", { replace: true });
        return;
      }

      try {
        // Check if languageId is a numeric index or a UUID
        const isNumericIndex = /^\d+$/.test(languageId);
        let found: Language | null = null;

        if (isNumericIndex) {
          // Handle numeric index (backward compatibility)
          const idNum = Number(languageId);
          if (idNum < 1) {
            toast.error(t("addLanguage.notFound"));
            navigate("/", { replace: true });
            return;
          }
          const langs = await languageService.getLanguages(undefined, { sort: 'name', order: 'desc', singlePage: true });
          const idx = idNum - 1;
          found = langs[idx];
        } else {
          // Handle UUID
          try {
            const langs = await languageService.getLanguages({ uuid: languageId }, { singlePage: true });
            found = langs[0] || null;
          } catch {
            found = null;
          }
        }

        if (found) {
          setLanguage(found);
        } else {
          toast.error(t("addLanguage.notFound"));
          navigate("/", { replace: true });
        }
      } catch (e) {
        toast.error(t("common.unexpectedError"));
        navigate("/", { replace: true });
      }
    };
    load();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !language) {
      toast.error(t("addLanguage.errorValidation"));
      return;
    }

    try {
      const form: LanguageForm = {
        name: language.name,
        shortcut: language.shortcut,
        codeForSpeech: language.codeForSpeech,
        codeForTranslator: language.codeForTranslator,
        isPublic: language.isPublic,
        specialLetters: language.specialLetters || "",
      };
      await languageService.updateLanguage(language.id, form);
      toast.success(t("addLanguage.successUpdate"));
      navigate("/");
    } catch (err) {
      if (err instanceof RequestError) {
        const desc = buildLocalizedErrorDescription(err, t);
        toast.error(desc || t("common.unexpectedError"));
        if (err.fieldErrors) setErrors(err.fieldErrors);
      } else {
        toast.error(t("common.unexpectedError"));
      }
    }
  };

  const handleDelete = async () => {
    if (!language) return;
    try {
      await languageService.deleteLanguage(language.id);
      toast.success(t("addLanguage.successDelete"));
      navigate("/");
    } catch (err) {
      if (err instanceof RequestError) {
        const desc = buildLocalizedErrorDescription(err, t);
        toast.error(desc || t("common.unexpectedError"));
      } else {
        toast.error(t("common.unexpectedError"));
      }
    }
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
                id="public"
                checked={language.isPublic}
                onCheckedChange={(checked) =>
                  setLanguage({ ...language, isPublic: checked as boolean })
                }
              />
              <Label htmlFor="public" className="cursor-pointer">{t("addLanguage.public")}</Label>
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
