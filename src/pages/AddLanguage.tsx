import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShortcutHints } from "@/components/ShortcutHints";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languageService } from "@/services/languageService";
import { RequestError, buildLocalizedErrorDescription } from "@/services/requestError";
import { authStateService } from "@/services/authStateService";

export default function AddLanguage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    shortcut: "",
    isPublic: true,
    codeForTranslator: "",
    codeForSpeech: "",
    specialLetters: "",
  });
  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const shortcutInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authStateService.initialize();
      if (!user) {
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name.length < 3) {
      newErrors.name = t("addLanguage.errorNameShort");
    } else if (formData.name.length > 64) {
      newErrors.name = t("addLanguage.errorNameLong");
    }

    if (formData.shortcut.length < 2) {
      newErrors.shortcut = t("addLanguage.errorShortcutShort");
    }

    if (formData.codeForTranslator && formData.codeForTranslator.length < 2) {
      newErrors.codeForTranslator = t("addLanguage.errorTranslatorShort");
    } else if (formData.codeForTranslator && formData.codeForTranslator.length > 15) {
      newErrors.codeForTranslator = t("addLanguage.errorTranslatorLong");
    }

    if (formData.codeForSpeech && formData.codeForSpeech.length < 2) {
      newErrors.codeForSpeech = t("addLanguage.errorSpeechShort");
    } else if (formData.codeForSpeech && formData.codeForSpeech.length > 15) {
      newErrors.codeForSpeech = t("addLanguage.errorSpeechLong");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("addLanguage.errorValidation"));
      return;
    }

    try {
      await languageService.createLanguage({
        name: formData.name,
        shortcut: formData.shortcut,
        codeForSpeech: formData.codeForSpeech,
        codeForTranslator: formData.codeForTranslator,
        isPublic: formData.isPublic,
        specialLetters: formData.specialLetters,
      });

      toast.success(t("addLanguage.successAdd"));
      navigate("/");
    } catch (err) {
      if (err instanceof RequestError) {
        // Show a friendly localized error message
        const desc = buildLocalizedErrorDescription(err, t as unknown as (k: string) => string);
        toast.error(desc || t("addLanguage.errorCreate"));
        // Map field errors back to form inputs if provided
        if (err.fieldErrors) {
          setErrors(err.fieldErrors);
        }
      } else {
        toast.error(t("addLanguage.errorCreate"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-2xl mx-auto">
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-6">{t("addLanguage.title")}</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("addLanguage.name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.shortcut}
                onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                onFocus={() => setShowShortcutHints(true)}
                placeholder={t("addLanguage.shortcutPlaceholder")}
                required
              />
              {showShortcutHints && (
                <ShortcutHints
                  value={formData.shortcut}
                  onSelect={(shortcut) => {
                    setFormData({ ...formData, shortcut });
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
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked as boolean })
                }
              />
              <Label htmlFor="public" className="cursor-pointer">{t("addLanguage.public")}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeForTranslator">{t("addLanguage.codeForTranslator")}</Label>
              <Input
                id="codeForTranslator"
                value={formData.codeForTranslator}
                onChange={(e) => setFormData({ ...formData, codeForTranslator: e.target.value })}
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
                value={formData.codeForSpeech}
                onChange={(e) => setFormData({ ...formData, codeForSpeech: e.target.value })}
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
                value={formData.specialLetters}
                onChange={(e) => setFormData({ ...formData, specialLetters: e.target.value })}
                placeholder={t("addLanguage.specialLettersPlaceholder")}
              />
              <p className="text-sm text-muted-foreground">{t("addLanguage.specialLettersHint")}</p>
            </div>

            <div className="flex gap-4">
              <Button type="submit">{t("addLanguage.addButton")}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
