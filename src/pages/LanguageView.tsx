import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { CategoryTree } from "@/components/CategoryTree";
import { Category } from "@/types/category";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StartRepeatingModal from "@/components/StartRepeatingModal";
import { repeatService } from "@/services/repeatService";
import { languageService, type Language } from "@/services/languageService";
import { categoryService } from "@/services/categoryService";


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
            toast.error("Language not found");
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

          // Load repeat data using the original languageId (for localStorage compatibility)
          const storedRepeatData = await repeatService.getRepeatData(languageId);

          if (storedRepeatData) {
            setRepeatData(storedRepeatData);
          } else {
            const initialRepeatData = { active: false, wordsLeft: 0 };
            setRepeatData(initialRepeatData);
            await repeatService.updateRepeatData(languageId, initialRepeatData);
          }
        } else {
          toast.error("Language not found");
          navigate("/");
        }
      } catch (error) {
        console.error("Error loading language data:", error);
        toast.error("Failed to load language data");
      }
    };
    
    loadData();
  }, [languageId, navigate]);

  const handleCategoriesUpdate = async () => {
    // Reload categories from backend
    if (languageId && language) {
      try {
        // Use the language.id which contains the UUID
        const categories = await categoryService.getAll(language.id);
        setCategories(categories);
      } catch (error) {
        console.error("Error reloading categories:", error);
        toast.error("Failed to reload categories");
      }
    }
  };

  const handleStartRepeating = () => {
    if (repeatData.active) {
      navigate(`/language/${languageId}/repeat`);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleResetRepeating = async () => {
    if (!languageId) return;
    
    const newRepeatData = { active: false, wordsLeft: 0 };
    setRepeatData(newRepeatData);
    await repeatService.updateRepeatData(languageId, newRepeatData);
    toast.success("Repeating reset");
  };

  const handleStartRepeatSubmit = async (data: {
    categoryIds: number[];
    includeChosen: boolean;
    wordCount: number;
    method: string;
  }) => {
    if (!languageId) return;
    
    // Simulate API call
    await repeatService.startRepeat(data);

    // Set repeat data with random wordsLeft
    const newRepeatData = {
      active: true,
      wordsLeft: Math.floor(Math.random() * 20) + 5,
    };
    setRepeatData(newRepeatData);
    await repeatService.updateRepeatData(languageId, newRepeatData);

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

          <CategoryTree categories={categories} languageId={languageId!} onUpdate={handleCategoriesUpdate} />
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
