// Service for repeat/practice operations

import { WordPart, Method } from "@/types/word";
import { SeparatorType } from "@/types/word";
import { HttpMethod, RequestBuilder, RequestService } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

// Backend DTOs
interface RepeatSessionDto {
  uuid: string;
  languageUuid: string;
  active: boolean;
  wordsLeft: number;
  totalWords: number;
  method: string;
  includeChosen: boolean;
  categoryUuids: string[];
  created: string;
}

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

interface RepeatWordDto {
  uuid: string;
  wordUuid: string;
  comment: string | null;
  mechanism: string;
  wordParts: WordPartDto[];
  method: Method;
  categoryMode: string;
}

interface CheckAnswerResultDto {
  correct: boolean;
  wordsLeft: number;
  sessionActive: boolean;
}

// Frontend types
export interface RepeatSession {
  uuid: string;
  languageUuid: string;
  active: boolean;
  wordsLeft: number;
  totalWords: number;
  method: string;
  includeChosen: boolean;
  categoryUuids: string[];
  created: number;
}

export interface RepeatWord {
  uuid: string;
  wordUuid: string;
  comment: string;
  mechanism: string;
  wordParts: WordPart[];
  method: Method;
  categoryMode: string;
}

export interface CheckAnswerResult {
  correct: boolean;
  wordsLeft: number;
  sessionActive: boolean;
}

// Request forms
export interface StartRepeatForm {
  categoryUuids: string[];
  includeChosen: boolean;
  wordCount: number;
  method: string;
}

export interface CheckAnswerForm {
  answers: { [key: string]: string };
}

// Helper to convert ISO date string to timestamp
const parseISOToTimestamp = (isoString: string | null): number | null => {
  if (!isoString) return null;
  return new Date(isoString).getTime();
};

// Helper to convert RepeatSessionDto to RepeatSession
const mapRepeatSessionDtoToRepeatSession = (dto: RepeatSessionDto): RepeatSession => {
  return {
    uuid: dto.uuid,
    languageUuid: dto.languageUuid,
    active: dto.active,
    wordsLeft: dto.wordsLeft,
    totalWords: dto.totalWords,
    method: dto.method,
    includeChosen: dto.includeChosen,
    categoryUuids: dto.categoryUuids,
    created: parseISOToTimestamp(dto.created) || Date.now(),
  };
};

// Helper to convert RepeatWordDto to RepeatWord
const mapRepeatWordDtoToRepeatWord = (dto: RepeatWordDto): RepeatWord => {
  return {
    uuid: dto.uuid,
    wordUuid: dto.wordUuid,
    comment: dto.comment || "",
    mechanism: dto.mechanism,
    wordParts: dto.wordParts.map((part) => ({
      answer: part.answer,
      basicWord: part.basicWord || "",
      position: part.position,
      toSpeech: part.toSpeech,
      word: part.word || "",
      isSeparator: part.separator,
      separatorType: part.separatorType as SeparatorType | undefined,
    })),
    method: dto.method,
    categoryMode: dto.categoryMode,
  };
};

// Helper to convert CheckAnswerResultDto to CheckAnswerResult
const mapCheckAnswerResultDtoToCheckAnswerResult = (dto: CheckAnswerResultDto): CheckAnswerResult => {
  return {
    correct: dto.correct,
    wordsLeft: dto.wordsLeft,
    sessionActive: dto.sessionActive,
  };
};

export const repeatService = {
  // Start a new repeat session
  startRepeat: async (
    languageUuid: string,
    form: StartRepeatForm
  ): Promise<RepeatSession> => {
    const service = new RequestService();
    const request = new RequestBuilder<StartRepeatForm>()
      .url(`/languages/${languageUuid}/repeat/start`)
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<StartRepeatForm, RepeatSessionDto>(request);
    throwIfError(res, 'Failed to start repeat session');

    if (!res.body) {
      throw new Error('No response body received');
    }

    return mapRepeatSessionDtoToRepeatSession(res.body);
  },

  // Get the active repeat session for a language
  getActiveSession: async (languageUuid: string): Promise<RepeatSession | null> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/repeat/session`)
      .method(HttpMethod.GET)
      .build();

    const res = await service.send<void, RepeatSessionDto>(request);

    if (res.statusCode === 404) {
      return null;
    }

    throwIfError(res, 'Failed to load repeat session');

    if (!res.body) return null;

    return mapRepeatSessionDtoToRepeatSession(res.body);
  },

  // Get the next word to repeat
  getNextWord: async (languageUuid: string): Promise<RepeatWord | null> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/repeat/next`)
      .method(HttpMethod.GET)
      .build();

    const res = await service.send<void, RepeatWordDto>(request);

    if (res.statusCode === 404) {
      return null;
    }

    throwIfError(res, 'Failed to load next word');

    if (!res.body) return null;

    return mapRepeatWordDtoToRepeatWord(res.body);
  },

  // Check the answer for the current word
  checkAnswer: async (
    languageUuid: string,
    wordUuid: string,
    form: CheckAnswerForm
  ): Promise<CheckAnswerResult> => {
    const service = new RequestService();
    const request = new RequestBuilder<CheckAnswerForm>()
      .url(`/languages/${languageUuid}/repeat/check/${wordUuid}`)
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<CheckAnswerForm, CheckAnswerResultDto>(request);
    throwIfError(res, 'Failed to check answer');

    if (!res.body) {
      throw new Error('No response body received');
    }

    return mapCheckAnswerResultDtoToCheckAnswerResult(res.body);
  },

  // Reset/cancel the active repeat session
  resetSession: async (languageUuid: string): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/repeat/reset`)
      .method(HttpMethod.POST)
      .responseAsVoid()
      .build();

    const res = await service.sendVoid(request);
    throwIfError(res, 'Failed to reset repeat session');
  },
};
