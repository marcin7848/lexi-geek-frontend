// Service for language operations

import { HttpMethod, RequestBuilder, RequestService, type PageDto, type PageableRequest } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

export interface Language {
  id: string;
  name: string;
  shortcut: string;
  hidden: boolean;
  codeForTranslator: string;
  codeForSpeech: string;
  specialLetters?: string;
}

// Backend DTO and filter form (frontend representations)
interface LanguageDto {
  uuid: string;
  name: string;
  shortcut: string;
  codeForSpeech: string;
  codeForTranslator: string;
  hidden: boolean;
  specialLetters: string;
}

export interface LanguageFilterForm {
  uuid?: string;
  name?: string;
  shortcut?: string;
  codeForSpeech?: string;
  codeForTranslator?: string;
  hidden?: boolean;
  specialLetters?: string;
}

// Payload for creating a language (matches backend LanguageForm)
export interface LanguageForm {
  name: string;
  shortcut: string;
  codeForSpeech: string;
  codeForTranslator: string;
  hidden: boolean;
  specialLetters: string;
}

const STORAGE_KEY = "languages";

export const languageService = {
  // New: fetch languages from backend with optional filter + pageable
  getLanguages: async (
    filter?: LanguageFilterForm | null,
    pageable?: PageableRequest | null
  ): Promise<Language[]> => {
    const service = new RequestService();
    const builder = new RequestBuilder<void>()
      .url('/languages')
      .method(HttpMethod.GET)
      .pageable(pageable ?? undefined);

    // Append filter params if provided
    if (filter) {
      if (filter.uuid) builder.param('uuid', String(filter.uuid));
      if (filter.name) builder.param('name', filter.name);
      if (filter.shortcut) builder.param('shortcut', filter.shortcut);
      if (filter.codeForSpeech) builder.param('codeForSpeech', filter.codeForSpeech);
      if (filter.codeForTranslator) builder.param('codeForTranslator', filter.codeForTranslator);
      if (typeof filter.hidden === 'boolean') builder.param('hidden', String(filter.hidden));
      if (filter.specialLetters) builder.param('specialLetters', filter.specialLetters);
    }

    const req = builder.build();
    const res = await service.send<void, PageDto<LanguageDto>>(req);
    throwIfError(res, 'Failed to load languages');

    const page = res.body as PageDto<LanguageDto> | null;
    const items = page?.items ?? [];
    return items.map((l) => ({
      id: l.uuid,
      name: l.name,
      shortcut: l.shortcut,
      codeForTranslator: l.codeForTranslator,
      codeForSpeech: l.codeForSpeech,
      hidden: l.hidden,
      specialLetters: l.specialLetters,
    }));
  },

  // Create language via backend
  createLanguage: async (form: LanguageForm): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<LanguageForm>()
      .url('/languages')
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<LanguageForm, unknown>(request);
    throwIfError(res, 'Failed to create language');
    return;
  },

  // Legacy localStorage helpers kept for backward compatibility within the app
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
