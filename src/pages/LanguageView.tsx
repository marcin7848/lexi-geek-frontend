import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { CategoryTree } from "@/components/CategoryTree";
import { mockCategoriesByLanguage } from "@/data/mockCategories";
import { Category } from "@/types/category";
import { toast } from "sonner";

type Language = {
  id: string;
  name: string;
  shortcut: string;
  hidden: boolean;
  codeForTranslator: string;
  codeForSpeech: string;
  specialLetters?: string;
};

export default function LanguageView() {
  const { languageId } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

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

  if (!language) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="py-8 space-y-6">
          <h1 className="text-3xl font-bold">{language.name}</h1>
          <CategoryTree categories={categories} onUpdate={handleCategoriesUpdate} />
        </div>
      </main>
    </div>
  );
}
