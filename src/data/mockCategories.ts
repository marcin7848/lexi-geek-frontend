import { Category } from "@/types/category";

// English categories (Language ID: "1")
const englishCategories: Category[] = [
  // Root categories
  { id: 1, id_parent: null, name: "Basic Vocabulary", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 2, id_parent: null, name: "Grammar", mode: "Exercise", method: "FirstToSecond", order: 2 },
  { id: 3, id_parent: null, name: "Phrases", mode: "Dictionary", method: "SecondToFirst", order: 3 },
  { id: 4, id_parent: null, name: "Advanced Topics", mode: "Exercise", method: "BothSides", order: 4 },
  
  // Children of Basic Vocabulary (id: 1)
  { id: 5, id_parent: 1, name: "Animals", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 6, id_parent: 1, name: "Food & Drinks", mode: "Dictionary", method: "FirstToSecond", order: 2 },
  { id: 7, id_parent: 1, name: "Colors", mode: "Exercise", method: "BothSides", order: 3 },
  
  // Children of Animals (id: 5) - nested level 2
  { id: 8, id_parent: 5, name: "Wild Animals", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 9, id_parent: 5, name: "Pets", mode: "Dictionary", method: "FirstToSecond", order: 2 },
  { id: 10, id_parent: 5, name: "Birds", mode: "Exercise", method: "SecondToFirst", order: 3 },
  
  // Children of Wild Animals (id: 8) - nested level 3
  { id: 11, id_parent: 8, name: "African Animals", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 12, id_parent: 8, name: "Ocean Animals", mode: "Dictionary", method: "FirstToSecond", order: 2 },
  
  // Children of Grammar (id: 2)
  { id: 13, id_parent: 2, name: "Verb Tenses", mode: "Exercise", method: "FirstToSecond", order: 1 },
  { id: 14, id_parent: 2, name: "Pronouns", mode: "Exercise", method: "BothSides", order: 2 },
  { id: 15, id_parent: 2, name: "Articles", mode: "Dictionary", method: "SecondToFirst", order: 3 },
  
  // Children of Verb Tenses (id: 13) - nested level 2
  { id: 16, id_parent: 13, name: "Present Tense", mode: "Exercise", method: "FirstToSecond", order: 1 },
  { id: 17, id_parent: 13, name: "Past Tense", mode: "Exercise", method: "FirstToSecond", order: 2 },
  { id: 18, id_parent: 13, name: "Future Tense", mode: "Exercise", method: "BothSides", order: 3 },
  
  // Children of Phrases (id: 3)
  { id: 19, id_parent: 3, name: "Greetings", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 20, id_parent: 3, name: "Common Expressions", mode: "Dictionary", method: "SecondToFirst", order: 2 },
  
  // Children of Advanced Topics (id: 4)
  { id: 21, id_parent: 4, name: "Business Language", mode: "Exercise", method: "BothSides", order: 1 },
  { id: 22, id_parent: 4, name: "Idioms", mode: "Dictionary", method: "FirstToSecond", order: 2 },
  { id: 23, id_parent: 4, name: "Slang", mode: "Dictionary", method: "SecondToFirst", order: 3 },
];

// Deutsch categories (Language ID: "2")
const deutschCategories: Category[] = [
  { id: 101, id_parent: null, name: "Grundwortschatz", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 102, id_parent: null, name: "Grammatik", mode: "Exercise", method: "FirstToSecond", order: 2 },
  
  { id: 103, id_parent: 101, name: "Verben", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 104, id_parent: 101, name: "Nomen", mode: "Dictionary", method: "FirstToSecond", order: 2 },
];

// Java categories (Language ID: "3")
const javaCategories: Category[] = [
  { id: 201, id_parent: null, name: "Basics", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 202, id_parent: null, name: "OOP", mode: "Exercise", method: "FirstToSecond", order: 2 },
  
  { id: 203, id_parent: 201, name: "Syntax", mode: "Dictionary", method: "BothSides", order: 1 },
  { id: 204, id_parent: 201, name: "Data Types", mode: "Dictionary", method: "FirstToSecond", order: 2 },
];

// Export categories by language ID
export const mockCategoriesByLanguage: Record<string, Category[]> = {
  "1": englishCategories,
  "2": deutschCategories,
  "3": javaCategories,
};

// Keep this export for backward compatibility
export const mockCategories = englishCategories;
