// Service for repeat/practice operations

import { Word } from "@/types/word";

export interface StartRepeatRequest {
  categoryIds: number[];
  includeChosen: boolean;
  wordCount: number;
  method: string;
}

export interface CheckAnswerRequest {
  wordId: number;
  answers: { [key: string]: string };
}

export interface RepeatSession {
  languageId: string;
  categoryIds: number[];
  words: Word[];
  currentIndex: number;
  method: string;
}

const CURRENT_SESSION_KEY = "repeat_current_session";

export const repeatService = {
  startRepeat: async (data: StartRepeatRequest): Promise<void> => {
    console.log("Starting repeat with data:", data);
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  checkAnswer: async (data: CheckAnswerRequest): Promise<void> => {
    console.log("Checking answer:", data);
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  saveSession: async (session: RepeatSession): Promise<void> => {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  },

  getSession: async (): Promise<RepeatSession | null> => {
    const stored = localStorage.getItem(CURRENT_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  clearSession: async (): Promise<void> => {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  },

  getRepeatData: async (languageId: string): Promise<any> => {
    const storageKey = `repeat_${languageId}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  },

  updateRepeatData: async (languageId: string, data: any): Promise<void> => {
    const storageKey = `repeat_${languageId}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
};
