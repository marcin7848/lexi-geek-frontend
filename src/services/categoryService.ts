// Service for category operations

import { Category } from "@/types/category";

export interface CategoryFilters {
  parentId?: number | null;
}

export const categoryService = {
  getAll: async (languageId: string, filters?: CategoryFilters): Promise<Category[]> => {
    const storageKey = `categories_${languageId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) return [];
    
    let categories: Category[] = JSON.parse(stored);
    
    // Apply filters
    if (filters?.parentId !== undefined) {
      categories = categories.filter(cat => cat.id_parent === filters.parentId);
    }
    
    return categories;
  },

  getById: async (languageId: string, categoryId: number): Promise<Category | null> => {
    const categories = await categoryService.getAll(languageId);
    return categories.find(cat => cat.id === categoryId) || null;
  },

  findCategoryInAllLanguages: async (categoryId: number): Promise<{ category: Category; languageId: string } | null> => {
    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    
    for (const language of languages) {
      const storageKey = `categories_${language.id}`;
      const storedCategories = localStorage.getItem(storageKey);
      
      if (storedCategories) {
        const categories: Category[] = JSON.parse(storedCategories);
        const found = categories.find((cat) => cat.id === categoryId);
        
        if (found) {
          return { category: found, languageId: language.id };
        }
      }
    }
    
    return null;
  },

  create: async (languageId: string, category: Category): Promise<Category> => {
    const categories = await categoryService.getAll(languageId);
    categories.push(category);
    
    const storageKey = `categories_${languageId}`;
    localStorage.setItem(storageKey, JSON.stringify(categories));
    
    return category;
  },

  update: async (languageId: string, categoryId: number, updates: Partial<Category>): Promise<Category | null> => {
    const categories = await categoryService.getAll(languageId);
    const index = categories.findIndex(cat => cat.id === categoryId);
    
    if (index === -1) return null;
    
    categories[index] = { ...categories[index], ...updates };
    
    const storageKey = `categories_${languageId}`;
    localStorage.setItem(storageKey, JSON.stringify(categories));
    
    return categories[index];
  },

  delete: async (languageId: string, categoryId: number): Promise<boolean> => {
    const categories = await categoryService.getAll(languageId);
    const filtered = categories.filter(cat => cat.id !== categoryId);
    
    if (filtered.length === categories.length) return false;
    
    const storageKey = `categories_${languageId}`;
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    
    return true;
  },

  initialize: async (languageId: string, defaultCategories: Category[]): Promise<void> => {
    const storageKey = `categories_${languageId}`;
    const existing = localStorage.getItem(storageKey);
    
    if (!existing) {
      localStorage.setItem(storageKey, JSON.stringify(defaultCategories));
    }
  },

  updateRepeatData: async (languageId: string, repeatData: any): Promise<void> => {
    const storageKey = `repeat_${languageId}`;
    localStorage.setItem(storageKey, JSON.stringify(repeatData));
  },

  getRepeatData: async (languageId: string): Promise<any> => {
    const storageKey = `repeat_${languageId}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  }
};
