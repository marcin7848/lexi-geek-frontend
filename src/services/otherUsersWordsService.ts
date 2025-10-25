// Service for other users' words operations

import { Word } from "@/types/word";

const STORAGE_KEY = "otherUsersWords";

export const otherUsersWordsService = {
  getAll: async (): Promise<Word[]> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getForCategory: async (categoryId: string): Promise<Word[]> => {
    const storageKey = `otherUsersWords_${categoryId}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  },

  acceptWord: async (categoryId: string, word: Word): Promise<void> => {
    // Add to category words
    const categoryStorageKey = `words_${categoryId}`;
    const categoryWords: Word[] = JSON.parse(localStorage.getItem(categoryStorageKey) || "[]");
    
    const acceptedWord = { ...word, accepted: true };
    categoryWords.push(acceptedWord);
    localStorage.setItem(categoryStorageKey, JSON.stringify(categoryWords));
    
    // Remove from other users words for this category
    const otherUsersKey = `otherUsersWords_${categoryId}`;
    const otherUsersWords: Word[] = JSON.parse(localStorage.getItem(otherUsersKey) || "[]");
    const filtered = otherUsersWords.filter(w => w.id !== word.id);
    localStorage.setItem(otherUsersKey, JSON.stringify(filtered));
    
    // Also remove from global other users words
    const allOtherUsersWords = await otherUsersWordsService.getAll();
    const filteredAll = allOtherUsersWords.filter(w => w.id !== word.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAll));
  },

  rejectWord: async (categoryId: string, wordId: number): Promise<void> => {
    // Remove from other users words for this category
    const otherUsersKey = `otherUsersWords_${categoryId}`;
    const otherUsersWords: Word[] = JSON.parse(localStorage.getItem(otherUsersKey) || "[]");
    const filtered = otherUsersWords.filter(w => w.id !== wordId);
    localStorage.setItem(otherUsersKey, JSON.stringify(filtered));
    
    // Also remove from global other users words
    const allOtherUsersWords = await otherUsersWordsService.getAll();
    const filteredAll = allOtherUsersWords.filter(w => w.id !== wordId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAll));
  },

  initialize: async (categoryId: string, words: Word[]): Promise<void> => {
    const storageKey = `otherUsersWords_${categoryId}`;
    const existing = localStorage.getItem(storageKey);
    
    if (!existing) {
      localStorage.setItem(storageKey, JSON.stringify(words));
    }
  }
};
