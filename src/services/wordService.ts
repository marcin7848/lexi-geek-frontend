// Service for word operations

import { Word, Mechanism, SeparatorType } from "@/types/word";
import { HttpMethod, RequestBuilder, RequestService, type PageDto, type PageableRequest } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

// Backend DTOs
interface WordPartDto {
  uuid?: string;
  answer: boolean;
  basicWord: string | null;
  position: number;
  toSpeech: boolean;
  separator: boolean;
  separatorType: string | null;
  word: string | null;
}


interface WordDto {
  uuid: string;
  accepted: boolean;
  chosen: boolean;
  comment: string | null;
  created: string;
  lastTimeRepeated: string | null;
  mechanism: Mechanism;
  repeated: number;
  resetTime: string | null;
  toRepeat: boolean;
  wordParts: WordPartDto[];
  categoryNames: string[];
}

// Request form for creating/updating words
export interface WordForm {
  comment?: string | null;
  mechanism: Mechanism;
  wordParts: {
    answer: boolean;
    basicWord?: string | null;
    position: number;
    toSpeech: boolean;
    separator: boolean;
    separatorType?: string | null;
    word?: string | null;
  }[];
}

// Filter form for querying words
export interface WordFilterForm {
  uuid?: string;
  accepted?: boolean;
  chosen?: boolean;
  searchText?: string;
  mechanism?: Mechanism;
  toRepeat?: boolean;
}

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
  column?: "word" | "comment" | "mechanism" | "chosen" | "repeated" | "lastTimeRepeated" | "created";
  direction?: "asc" | "desc";
}

export interface WordsResponse {
  words: Word[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Helper to convert ISO date string to timestamp
const parseISOToTimestamp = (isoString: string | null): number | null => {
  if (!isoString) return null;
  return new Date(isoString).getTime();
};

// Helper to convert WordDto to Word
const mapWordDtoToWord = (dto: WordDto): Word => {
  return {
    id: parseInt(dto.uuid.split('-')[0], 16), // Generate numeric ID from UUID
    uuid: dto.uuid,
    accepted: dto.accepted,
    chosen: dto.chosen,
    comment: dto.comment || "",
    resetTimestamp: parseISOToTimestamp(dto.resetTime),
    mechanism: dto.mechanism,
    toRepeat: dto.toRepeat,
    repeated: dto.repeated,
    lastTimestampRepeated: parseISOToTimestamp(dto.lastTimeRepeated),
    created: parseISOToTimestamp(dto.created) || Date.now(),
    wordParts: dto.wordParts.map((part) => ({
      answer: part.answer,
      basicWord: part.basicWord || "",
      position: part.position,
      toSpeech: part.toSpeech,
      word: part.word || "",
      isSeparator: part.separator,
      separatorType: part.separatorType as SeparatorType | undefined,
    })),
    wordStats: [],
    inCategories: dto.categoryNames || [],
  };
};

// Helper to convert Word to WordForm
const mapWordToWordForm = (word: Word): WordForm => {
  return {
    comment: word.comment || null,
    mechanism: word.mechanism,
    wordParts: word.wordParts.map((part) => ({
      answer: part.answer,
      basicWord: part.basicWord || null,
      position: part.position,
      toSpeech: part.toSpeech,
      separator: part.isSeparator || false,
      separatorType: part.separatorType || null,
      word: part.word || null,
    })),
  };
};

export const wordService = {
  // Get words with optional filters and pagination
  getWords: async (
    languageUuid: string,
    categoryUuid: string,
    filters?: WordFilters,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<WordsResponse> => {
    const service = new RequestService();
    const builder = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/words`)
      .method(HttpMethod.GET);

    // Build pageable request
    const pageable: PageableRequest = {
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 20,
      singlePage: !pagination,
    };

    // Add sorting if provided
    if (sort?.column) {
      pageable.sort = sort.column;
      pageable.order = sort.direction || 'asc';
    }

    builder.pageable(pageable);

    // Apply filters
    if (filters) {
      if (filters.accepted !== undefined) {
        builder.param('accepted', String(filters.accepted));
      }
      if (filters.mechanism && filters.mechanism !== "ALL") {
        builder.param('mechanism', filters.mechanism);
      }
      if (filters.searchText) {
        builder.param('searchText', filters.searchText);
      }
      if (filters.chosen !== undefined) {
        builder.param('chosen', String(filters.chosen));
      }
    }

    const req = builder.build();
    const res = await service.send<void, PageDto<WordDto>>(req);
    throwIfError(res, 'Failed to load words');

    const page = res.body as PageDto<WordDto> | null;
    const items = page?.items ?? [];
    const words = items.map(mapWordDtoToWord);

    return {
      words,
      total: Number(page?.total ?? 0),
      page: page?.page ?? 1,
      pageSize: page?.pageSize ?? 20,
      totalPages: page ? Math.ceil(Number(page.total) / page.pageSize) : 1
    };
  },

  // Get a single word by UUID
  getById: async (
    languageUuid: string,
    categoryUuid: string,
    wordUuid: string
  ): Promise<Word | null> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/words/${wordUuid}`)
      .method(HttpMethod.GET)
      .build();

    const res = await service.send<void, WordDto>(request);

    if (res.statusCode === 404) {
      return null;
    }

    throwIfError(res, 'Failed to load word');

    if (!res.body) return null;

    return mapWordDtoToWord(res.body);
  },

  // Create a new word
  createWord: async (
    languageUuid: string,
    categoryUuid: string,
    form: WordForm
  ): Promise<Word> => {
    const service = new RequestService();
    const request = new RequestBuilder<WordForm>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/words`)
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<WordForm, WordDto>(request);
    throwIfError(res, 'Failed to create word');

    if (!res.body) {
      throw new Error('No response body received');
    }

    return mapWordDtoToWord(res.body);
  },

  // Update an existing word
  updateWord: async (
    languageUuid: string,
    categoryUuid: string,
    wordUuid: string,
    form: WordForm
  ): Promise<Word> => {
    const service = new RequestService();
    const request = new RequestBuilder<WordForm>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/words/${wordUuid}`)
      .method(HttpMethod.PUT)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<WordForm, WordDto>(request);
    throwIfError(res, 'Failed to update word');

    if (!res.body) {
      throw new Error('No response body received');
    }

    return mapWordDtoToWord(res.body);
  },

  // Delete a word
  deleteWord: async (
    languageUuid: string,
    categoryUuid: string,
    wordUuid: string
  ): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/words/${wordUuid}`)
      .method(HttpMethod.DELETE)
      .responseAsVoid()
      .build();

    const res = await service.sendVoid(request);
    throwIfError(res, 'Failed to delete word');
  },

  // Accept a word
  acceptWord: async (
    languageUuid: string,
    categoryUuid: string,
    wordUuid: string
  ): Promise<Word> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/words/${wordUuid}/accept`)
      .method(HttpMethod.PATCH)
      .build();

    const res = await service.send<void, WordDto>(request);
    throwIfError(res, 'Failed to accept word');

    if (!res.body) {
      throw new Error('No response body received');
    }

    return mapWordDtoToWord(res.body);
  },

  // Choose a word (toggle chosen status)
  chooseWord: async (
    languageUuid: string,
    categoryUuid: string,
    wordUuid: string
  ): Promise<Word> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/words/${wordUuid}/choose`)
      .method(HttpMethod.PATCH)
      .build();

    const res = await service.send<void, WordDto>(request);
    throwIfError(res, 'Failed to toggle chosen status');

    if (!res.body) {
      throw new Error('No response body received');
    }

    return mapWordDtoToWord(res.body);
  },

  // Update word categories
  updateWordCategories: async (
    languageUuid: string,
    wordUuid: string,
    categoryUuids: string[]
  ): Promise<Word> => {
    const service = new RequestService();
    const request = new RequestBuilder<{ categoryUuids: string[] }>()
      .url(`/languages/${languageUuid}/words/${wordUuid}/categories`)
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body({ categoryUuids })
      .build();

    const res = await service.send<{ categoryUuids: string[] }, WordDto>(request);
    throwIfError(res, 'Failed to update word categories');

    if (!res.body) {
      throw new Error('No response body received');
    }

    return mapWordDtoToWord(res.body);
  },

  // Convenience method: Get all words for a category (no pagination)
  getAll: async (
    languageUuid: string,
    categoryUuid: string
  ): Promise<Word[]> => {
    const response = await wordService.getWords(languageUuid, categoryUuid);
    return response.words;
  }
};
