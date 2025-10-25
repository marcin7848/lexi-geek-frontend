// Service for language operations

export interface Language {
  id: string;
  name: string;
  shortcut: string;
  hidden: boolean;
  codeForTranslator: string;
  codeForSpeech: string;
  specialLetters?: string;
}

const STORAGE_KEY = "languages";

export const languageService = {
  getAll: async (): Promise<Language[]> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  },

  getById: async (id: string): Promise<Language | null> => {
    const languages = await languageService.getAll();
    return languages.find(lang => lang.id === id) || null;
  },

  create: async (language: Language): Promise<Language> => {
    const languages = await languageService.getAll();
    languages.push(language);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(languages));
    return language;
  },

  update: async (id: string, updates: Partial<Language>): Promise<Language | null> => {
    const languages = await languageService.getAll();
    const index = languages.findIndex(lang => lang.id === id);
    
    if (index === -1) return null;
    
    languages[index] = { ...languages[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(languages));
    return languages[index];
  },

  delete: async (id: string): Promise<boolean> => {
    const languages = await languageService.getAll();
    const filtered = languages.filter(lang => lang.id !== id);
    
    if (filtered.length === languages.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  initialize: async (defaultLanguages: Language[]): Promise<void> => {
    const existing = await languageService.getAll();
    if (existing.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLanguages));
    }
  }
};
