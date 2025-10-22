import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { CategoryTree } from "@/components/CategoryTree";
import { mockCategoriesByLanguage } from "@/data/mockCategories";
import { Category } from "@/types/category";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StartRepeatingModal from "@/components/StartRepeatingModal";
import { repeatService } from "@/services/repeatService";

type Language = {
  id: string;
  name: string;
  shortcut: string;
  hidden: boolean;
  codeForTranslator: string;
  codeForSpeech: string;
  specialLetters?: string;
};

type RepeatData = {
  active: boolean;
  wordsLeft: number;
};

export default function LanguageView() {
  const { languageId } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [repeatData, setRepeatData] = useState<RepeatData>({ active: false, wordsLeft: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    const found = languages.find((lang: Language) => lang.id === languageId);
    
    if (found) {
      setLanguage(found);
      
      // Load categories from localStorage or initialize with mock data
      const storageKey = `categories_${languageId}`;
      const storedCategories = localStorage.getItem(storageKey);
      
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        // Initialize with mock data for this language
        const languageCategories = mockCategoriesByLanguage[languageId || "1"] || [];
        setCategories(languageCategories);
        localStorage.setItem(storageKey, JSON.stringify(languageCategories));
      }

      // Load or initialize repeat data
      const repeatStorageKey = `repeat_${languageId}`;
      const storedRepeatData = localStorage.getItem(repeatStorageKey);
      
      if (storedRepeatData) {
        setRepeatData(JSON.parse(storedRepeatData));
      } else {
        const initialRepeatData = { active: false, wordsLeft: 0 };
        setRepeatData(initialRepeatData);
        localStorage.setItem(repeatStorageKey, JSON.stringify(initialRepeatData));
      }
    } else {
      toast.error("Language not found");
      navigate("/");
    }
  }, [languageId, navigate]);

  const handleCategoriesUpdate = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    // Persist to localStorage
    const storageKey = `categories_${languageId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedCategories));
    toast.success("Categories updated");
  };

  const handleStartRepeating = () => {
    if (repeatData.active) {
      navigate(`/language/${languageId}/repeat`);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleResetRepeating = () => {
    const newRepeatData = { active: false, wordsLeft: 0 };
    setRepeatData(newRepeatData);
    const storageKey = `repeat_${languageId}`;
    localStorage.setItem(storageKey, JSON.stringify(newRepeatData));
    toast.success("Repeating reset");
  };

  const handleStartRepeatSubmit = async (data: {
    categoryIds: number[];
    includeChosen: boolean;
    wordCount: number;
    method: string;
  }) => {
    // Simulate API call
    await repeatService.startRepeat(data);

    // Set repeat data with random wordsLeft
    const newRepeatData = {
      active: true,
      wordsLeft: Math.floor(Math.random() * 20) + 5,
    };
    setRepeatData(newRepeatData);
    const storageKey = `repeat_${languageId}`;
    localStorage.setItem(storageKey, JSON.stringify(newRepeatData));

    setIsModalOpen(false);
    navigate(`/language/${languageId}/repeat`);
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
              {repeatData.active ? "Back to repeating" : "Start repeating"}
            </Button>
            {repeatData.active && (
              <>
                <span className="text-lg">Words left: {repeatData.wordsLeft}</span>
                <Button onClick={handleResetRepeating} variant="outline">
                  Reset repeating
                </Button>
              </>
            )}
          </div>

          <CategoryTree categories={categories} onUpdate={handleCategoriesUpdate} />
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
