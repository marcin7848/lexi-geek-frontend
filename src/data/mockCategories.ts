import { Category } from "@/types/category";

// English categories (Language ID: "1")
const englishCategories: Category[] = [
  { id: 1, id_parent: null, name: "Basic Vocabulary", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 2, id_parent: null, name: "Grammar", mode: "Exercise", method: "FirstToSecond", order: 2 },
  { id: 3, id_parent: null, name: "Phrases", mode: "Dictionary", method: "SecondToFirst", order: 3 },
];

// Deutsch categories (Language ID: "2")
const deutschCategories: Category[] = [
  { id: 101, id_parent: null, name: "Grundwortschatz", mode: "Dictionary", method: "BothSides", order: 1 },
];

// Java categories (Language ID: "3")
const javaCategories: Category[] = [
  { id: 201, id_parent: null, name: "Basics", mode: "Dictionary", method: "BothSides", order: 1 },
];

// Export categories by language ID
export const mockCategoriesByLanguage: Record<string, Category[]> = {
  "1": englishCategories,
  "2": deutschCategories,
  "3": javaCategories,
};

// Keep this export for backward compatibility
export const mockCategories = englishCategories;
