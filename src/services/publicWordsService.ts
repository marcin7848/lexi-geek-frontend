// Service for other users' words operations (public/shared words)

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

export interface PublicWordsFilters {
  mechanism?: Mechanism | "ALL";
  searchText?: string;
  categoryName?: string;
}

export interface PublicWordsPaginationParams {
  page: number;
  pageSize: number;
}

export interface PublicWordsSortParams {
  column?: "word" | "comment" | "mechanism" | "category";
  direction?: "asc" | "desc";
}

export interface PublicWordsResponse {
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

export const publicWordsService = {
  // Get public/shared words for a category with optional filters and pagination
  getPublicWords: async (
    languageUuid: string,
    categoryUuid: string,
    filters?: PublicWordsFilters,
    pagination?: PublicWordsPaginationParams,
    sort?: PublicWordsSortParams
  ): Promise<PublicWordsResponse> => {
    const service = new RequestService();
    const builder = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/public-words`)
      .method(HttpMethod.GET);

    // Build pageable request
    const pageable: PageableRequest = {
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 20,
      singlePage: !pagination,
    };

    // Add sorting if provided
    if (sort?.column) {
      // Map UI column names to backend field names
      const sortMap: Record<string, string> = {
        word: 'word',
        comment: 'comment',
        mechanism: 'mechanism',
        category: 'category',
      };
      pageable.sort = sortMap[sort.column] || sort.column;
      pageable.order = sort.direction || 'asc';
    }

    builder.pageable(pageable);

    // Apply filters
    if (filters) {
      if (filters.mechanism && filters.mechanism !== "ALL") {
        builder.param('mechanism', filters.mechanism);
      }
      if (filters.searchText) {
        builder.param('searchText', filters.searchText);
      }
      if (filters.categoryName) {
        builder.param('categoryName', filters.categoryName);
      }
    }

    const req = builder.build();
    const res = await service.send<void, PageDto<WordDto>>(req);
    throwIfError(res, 'Failed to load other users words');

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

  // Accept a public word (add it to current user's category)
  acceptWord: async (
    languageUuid: string,
    categoryUuid: string,
    wordUuid: string
  ): Promise<Word> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/public-words/${wordUuid}/accept`)
      .method(HttpMethod.POST)
      .build();

    const res = await service.send<void, WordDto>(request);
    throwIfError(res, 'Failed to accept word');

    if (!res.body) {
      throw new Error('No response body received');
    }

    return mapWordDtoToWord(res.body);
  },

  // Reject a public word (mark as not interested)
  rejectWord: async (
    languageUuid: string,
    categoryUuid: string,
    wordUuid: string
  ): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/public-words/${wordUuid}/reject`)
      .method(HttpMethod.POST)
      .responseAsVoid()
      .build();

    const res = await service.sendVoid(request);
    throwIfError(res, 'Failed to reject word');
  },
};
