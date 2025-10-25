// Service for word operations

import { Word, Mechanism } from "@/types/word";

export interface WordFilters {
  accepted?: boolean;
  mechanism?: Mechanism | "ALL";
  searchText?: string;
  chosen?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  column?: "word" | "comment" | "mechanism" | "chosen" | "repeated" | "lastTimestampRepeated" | "created";
  direction?: "asc" | "desc";
}

export interface WordsResponse {
  words: Word[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const getWordText = (wordParts: Word["wordParts"]) => {
  const sortedParts = [...wordParts].sort((a, b) => a.position - b.position);
  return sortedParts.map((part) => part.word).join(" ");
};

export const wordService = {
  getWords: async (
    categoryId: string,
    filters?: WordFilters,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<WordsResponse> => {
    const storageKey = `words_${categoryId}`;
    const stored = localStorage.getItem(storageKey);
    
    let words: Word[] = stored ? JSON.parse(stored) : [];
    
    // Apply filters
    if (filters?.accepted !== undefined) {
      words = words.filter(word => word.accepted === filters.accepted);
    }
    
    if (filters?.mechanism && filters.mechanism !== "ALL") {
      words = words.filter(word => word.mechanism === filters.mechanism);
    }
    
    if (filters?.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      words = words.filter(word => {
        const wordText = getWordText(word.wordParts).toLowerCase();
        const commentText = word.comment.toLowerCase();
        return wordText.includes(searchLower) || commentText.includes(searchLower);
      });
    }
    
    if (filters?.chosen !== undefined) {
      words = words.filter(word => word.chosen === filters.chosen);
    }
    
    // Apply sorting
    if (sort?.column) {
      words.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sort.column) {
          case "word":
            aValue = getWordText(a.wordParts).toLowerCase();
            bValue = getWordText(b.wordParts).toLowerCase();
            break;
          case "comment":
            aValue = a.comment.toLowerCase();
            bValue = b.comment.toLowerCase();
            break;
          case "mechanism":
            aValue = a.mechanism;
            bValue = b.mechanism;
            break;
          case "chosen":
            aValue = a.chosen ? 1 : 0;
            bValue = b.chosen ? 1 : 0;
            break;
          case "repeated":
            aValue = a.repeated;
            bValue = b.repeated;
            break;
          case "lastTimestampRepeated":
            aValue = a.lastTimestampRepeated || 0;
            bValue = b.lastTimestampRepeated || 0;
            break;
          case "created":
            aValue = a.created;
            bValue = b.created;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    
    const total = words.length;
    
    // Apply pagination
    if (pagination) {
      const startIndex = (pagination.page - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      words = words.slice(startIndex, endIndex);
    }
    
    return {
      words,
      total,
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || total,
      totalPages: pagination ? Math.ceil(total / pagination.pageSize) : 1
    };
  },

  getById: async (categoryId: string, wordId: number): Promise<Word | null> => {
    const storageKey = `words_${categoryId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) return null;
    
    const words: Word[] = JSON.parse(stored);
    return words.find(word => word.id === wordId) || null;
  },

  addWord: async (categoryId: string, word: Word): Promise<Word> => {
    const storageKey = `words_${categoryId}`;
    const stored = localStorage.getItem(storageKey);
    const words: Word[] = stored ? JSON.parse(stored) : [];
    
    words.push(word);
    localStorage.setItem(storageKey, JSON.stringify(words));
    
    return word;
  },

  updateWord: async (categoryId: string, wordId: number, updates: Partial<Word>): Promise<Word | null> => {
    const storageKey = `words_${categoryId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) return null;
    
    const words: Word[] = JSON.parse(stored);
    const index = words.findIndex(word => word.id === wordId);
    
    if (index === -1) return null;
    
    words[index] = { ...words[index], ...updates };
    localStorage.setItem(storageKey, JSON.stringify(words));
    
    return words[index];
  },

  deleteWord: async (categoryId: string, wordId: number): Promise<boolean> => {
    const storageKey = `words_${categoryId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) return false;
    
    const words: Word[] = JSON.parse(stored);
    const filtered = words.filter(word => word.id !== wordId);
    
    if (filtered.length === words.length) return false;
    
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    return true;
  },

  initialize: async (categoryId: string, defaultWords: Word[]): Promise<void> => {
    const storageKey = `words_${categoryId}`;
    const existing = localStorage.getItem(storageKey);
    
    if (!existing) {
      localStorage.setItem(storageKey, JSON.stringify(defaultWords));
    }
  },

  // Batch operations
  updateMultiple: async (categoryId: string, updates: Array<{ id: number; data: Partial<Word> }>): Promise<void> => {
    const storageKey = `words_${categoryId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) return;
    
    let words: Word[] = JSON.parse(stored);
    
    updates.forEach(({ id, data }) => {
      const index = words.findIndex(word => word.id === id);
      if (index !== -1) {
        words[index] = { ...words[index], ...data };
      }
    });
    
    localStorage.setItem(storageKey, JSON.stringify(words));
  }
};
