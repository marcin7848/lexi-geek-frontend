import { useEffect, useState } from "react";
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
  const [language, setLanguage] = useState<Language | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    const found = languages.find((lang: Language) => lang.id === languageId);
    
    if (found) {
      setLanguage(found);
    } else {
      toast.error("Language not found");
      navigate("/");
    }
  }, [languageId, navigate]);

  const validateForm = () => {
    if (!language) return false;
    
    const newErrors: Record<string, string> = {};

    if (language.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (language.name.length > 64) {
      newErrors.name = "Name must be less than 64 characters";
    }

    if (language.shortcut.length < 2) {
      newErrors.shortcut = "Shortcut must be at least 2 characters";
    }

    if (language.codeForTranslator && language.codeForTranslator.length < 2) {
      newErrors.codeForTranslator = "Code for translator must be at least 2 characters";
    } else if (language.codeForTranslator && language.codeForTranslator.length > 15) {
      newErrors.codeForTranslator = "Code for translator must be less than 15 characters";
    }

    if (language.codeForSpeech && language.codeForSpeech.length < 2) {
      newErrors.codeForSpeech = "Code for speech must be at least 2 characters";
    } else if (language.codeForSpeech && language.codeForSpeech.length > 15) {
      newErrors.codeForSpeech = "Code for speech must be less than 15 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    const updatedLanguages = languages.map((lang: Language) =>
      lang.id === languageId ? language : lang
    );

    localStorage.setItem("languages", JSON.stringify(updatedLanguages));
    toast.success("Language updated successfully");
  };

  const handleDelete = () => {
    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    const filteredLanguages = languages.filter((lang: Language) => lang.id !== languageId);
    
    localStorage.setItem("languages", JSON.stringify(filteredLanguages));
    toast.success("Language deleted successfully");
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
          <h1 className="text-3xl font-bold mb-6">Language Settings: {language.name}</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={language.name}
                onChange={(e) => setLanguage({ ...language, name: e.target.value })}
                placeholder="Enter language name"
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortcut">Shortcut *</Label>
              <Input
                id="shortcut"
                value={language.shortcut}
                onChange={(e) => setLanguage({ ...language, shortcut: e.target.value })}
                placeholder="Enter shortcut"
                required
              />
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
              <Label htmlFor="hidden" className="cursor-pointer">Hidden</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeForTranslator">Code for Translator</Label>
              <Input
                id="codeForTranslator"
                value={language.codeForTranslator}
                onChange={(e) => setLanguage({ ...language, codeForTranslator: e.target.value })}
                placeholder="e.g., en-US"
              />
              {errors.codeForTranslator && (
                <p className="text-sm text-destructive">{errors.codeForTranslator}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeForSpeech">Code for Speech</Label>
              <Input
                id="codeForSpeech"
                value={language.codeForSpeech}
                onChange={(e) => setLanguage({ ...language, codeForSpeech: e.target.value })}
                placeholder="e.g., en-US"
              />
              {errors.codeForSpeech && (
                <p className="text-sm text-destructive">{errors.codeForSpeech}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialLetters">Special Letters</Label>
              <Input
                id="specialLetters"
                value={language.specialLetters || ""}
                onChange={(e) => setLanguage({ ...language, specialLetters: e.target.value })}
                placeholder="e.g., ä,Ä,ö,Ö,ü,Ü,ß"
              />
              <p className="text-sm text-muted-foreground">Separate letters with commas</p>
            </div>

            <div className="flex gap-4">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Delete Language
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the language "{language.name}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
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
