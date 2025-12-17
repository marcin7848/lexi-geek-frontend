// Service for language operations

import { HttpMethod, RequestBuilder, RequestService, type PageDto, type PageableRequest } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

export interface Language {
  id: string;
  name: string;
  shortcut: string;
  isPublic: boolean;
  codeForSpeech: string;
  specialLetters?: string;
}

// Backend DTO and filter form (frontend representations)
interface LanguageDto {
  uuid: string;
  name: string;
  shortcut: string;
  codeForSpeech: string;
  isPublic: boolean;
  specialLetters: string;
}

export interface ShortcutDto {
  name: string;
  shortcut: string;
  usage: number;
}

export interface LanguageFilterForm {
  uuid?: string;
  name?: string;
  shortcut?: string;
  codeForSpeech?: string;
  isPublic?: boolean;
  specialLetters?: string;
}

// Payload for creating a language (matches backend LanguageForm)
export interface LanguageForm {
  name: string;
  shortcut: string;
  codeForSpeech: string;
  isPublic: boolean;
  specialLetters: string;
}

// Cache for languages to prevent duplicate API calls
let languagesCache: Language[] | null = null;
let languagesCacheTime: number = 0;
let languagesLoadingPromise: Promise<Language[]> | null = null;
const CACHE_DURATION = 5000; // 5 seconds cache

export const languageService = {
  // Clear the cache (useful after creating/updating/deleting languages)
  clearCache: () => {
    languagesCache = null;
    languagesCacheTime = 0;
    languagesLoadingPromise = null;
  },

  // New: fetch languages from backend with optional filter + pageable
  getLanguages: async (
    filter?: LanguageFilterForm | null,
    pageable?: PageableRequest | null,
    skipCache: boolean = false
  ): Promise<Language[]> => {
    // Check if we can use cached data (only for full list without filters)
    const now = Date.now();
    const isCacheable = !skipCache &&
                        !filter &&
                        pageable?.singlePage === true &&
                        !pageable?.sort;

    const canUseCache = isCacheable &&
                        languagesCache !== null &&
                        (now - languagesCacheTime) < CACHE_DURATION;

    if (canUseCache) {
      return languagesCache!;
    }

    // If a request is already in progress for cacheable data, wait for it
    if (isCacheable && languagesLoadingPromise !== null) {
      return languagesLoadingPromise;
    }


    const makeRequest = async (): Promise<Language[]> => {
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
        if (typeof filter.isPublic === 'boolean') builder.param('public', String(filter.isPublic));
        if (filter.specialLetters) builder.param('specialLetters', filter.specialLetters);
      }

      const req = builder.build();
      const res = await service.send<void, PageDto<LanguageDto>>(req);
      throwIfError(res, 'Failed to load languages');

      const page = res.body as PageDto<LanguageDto> | null;
      const items = page?.items ?? [];
      const languages = items.map((l) => ({
        id: l.uuid,
        name: l.name,
        shortcut: l.shortcut,
        codeForSpeech: l.codeForSpeech,
        isPublic: l.isPublic,
        specialLetters: l.specialLetters,
      }));

      // Cache the result if it's a full list without filters
      if (isCacheable) {
        languagesCache = languages;
        languagesCacheTime = now;
      }

      return languages;
    };

    // Store the promise for cacheable requests to prevent concurrent calls
    if (isCacheable) {
      languagesLoadingPromise = makeRequest();
      try {
        return await languagesLoadingPromise;
      } finally {
        languagesLoadingPromise = null;
      }
    } else {
      return makeRequest();
    }
  },

  // Get popular shortcuts with optional filter
  getPopularShortcuts: async (shortcut?: string): Promise<ShortcutDto[]> => {
    const service = new RequestService();
    const builder = new RequestBuilder<void>()
      .url('/languages/shortcuts')
      .method(HttpMethod.GET);

    // Add shortcut filter parameter if provided
    if (shortcut) {
      builder.param('shortcut', shortcut);
    }

    const req = builder.build();
    const res = await service.send<void, ShortcutDto[]>(req);
    throwIfError(res, 'Failed to load popular shortcuts');

    return res.body as ShortcutDto[] ?? [];
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
    languageService.clearCache();
    return;
  },

  // Update language via backend
  updateLanguage: async (uuid: string, form: LanguageForm): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<LanguageForm>()
      .url(`/languages/${uuid}`)
      .method(HttpMethod.PUT)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<LanguageForm, unknown>(request);
    throwIfError(res, 'Failed to update language');
    languageService.clearCache();
    return;
  },

  // Delete language via backend
  deleteLanguage: async (uuid: string): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${uuid}`)
      .method(HttpMethod.DELETE)
      .responseAsVoid()
      .build();

    const res = await service.sendVoid(request);
    throwIfError(res, 'Failed to delete language');
    languageService.clearCache();
    return;
  },

  // Fetch all languages from backend (convenience method)
  getAll: async (): Promise<Language[]> => {
    return await languageService.getLanguages(null, { singlePage: true });
  },

  // Fetch a single language by UUID from backend
  getById: async (uuid: string): Promise<Language | null> => {
    const languages = await languageService.getLanguages({ uuid }, { singlePage: true });
    return languages.find(lang => lang.id === uuid) || null;
  },
};
