// Service for repeat/practice operations

import { WordPart, Method } from "@/types/word";
import { HttpMethod, RequestBuilder, RequestService } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

// Backend DTOs
interface RepeatSessionDto {
  uuid: string;
  languageUuid: string;
  wordsLeft: number;
  method: string; // "BOTH" | "QUESTION_TO_ANSWER" | "ANSWER_TO_QUESTION"
  created: string;
}

interface WordPartDto {
  uuid: string | null;
  answer: boolean;
  basicWord: string | null;
  position: number;
  toSpeech: boolean;
  separator: boolean;
  separatorType: string | null;
  word: string;
}

interface RepeatWordDto {
  uuid: string; // This is the wordUuid from backend
  comment: string | null;
  mechanism: string;
  wordParts: WordPartDto[];
  method: string; // "QuestionToAnswer" | "AnswerToQuestion"
  categoryMode: string;
}

interface AnswerDetailDto {
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

interface CheckAnswerResultDto {
  correct: boolean;
  wordsLeft: number;
  sessionActive: boolean;
  answerDetails: AnswerDetailDto[];
}

// Frontend types
export interface RepeatSession {
  uuid: string;
  languageUuid: string;
  wordsLeft: number;
  method: string;
  created: number;
}

export interface RepeatWord {
  uuid: string;
  comment: string;
  mechanism: string;
  wordParts: WordPart[];
  method: Method;
  categoryMode: string;
}

export interface AnswerDetail {
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface CheckAnswerResult {
  correct: boolean;
  wordsLeft: number;
  sessionActive: boolean;
  answerDetails: AnswerDetail[];
}

// Request forms
export interface StartRepeatForm {
  categoryUuids: string[];
  includeChosen: boolean;
  wordCount: number;
  method: string; // "BOTH" | "QUESTION_TO_ANSWER" | "ANSWER_TO_QUESTION"
}

export interface CheckAnswerForm {
  answers: { [key: string]: string };
  method: string; // "QUESTION_TO_ANSWER" | "ANSWER_TO_QUESTION"
}

// Helper to convert ISO date string to timestamp
const parseISOToTimestamp = (isoString: string | null): number | null => {
  if (!isoString) return null;
  return new Date(isoString).getTime();
};

// Helper to convert frontend Method to backend format
const convertMethodToBackendFormat = (method: Method): string => {
  if (method === "QuestionToAnswer") return "QUESTION_TO_ANSWER";
  if (method === "AnswerToQuestion") return "ANSWER_TO_QUESTION";
  return method;
};

// Helper to convert RepeatSessionDto to RepeatSession
const mapRepeatSessionDtoToRepeatSession = (dto: RepeatSessionDto): RepeatSession => {
  return {
    uuid: dto.uuid,
    languageUuid: dto.languageUuid,
    wordsLeft: dto.wordsLeft,
    method: dto.method,
    created: parseISOToTimestamp(dto.created) || Date.now(),
  };
};

// Helper to convert RepeatWordDto to RepeatWord
const mapRepeatWordDtoToRepeatWord = (dto: RepeatWordDto): RepeatWord => {
  // Convert the API WordPartDto structure to frontend WordPart structure
  const wordParts: WordPart[] = dto.wordParts.map((part) => ({
    answer: part.answer,
    basicWord: part.basicWord || "",
    position: part.position,
    toSpeech: part.toSpeech,
    word: part.word,
    isSeparator: part.separator,
    separatorType: part.separatorType ? (part.separatorType as "ENTER" | "TAB" | "MULTI_DASH") : undefined,
  }));

  // The method is already in frontend format ("QuestionToAnswer" or "AnswerToQuestion")
  const method = dto.method as Method;

  return {
    uuid: dto.uuid,
    comment: dto.comment || "",
    mechanism: dto.mechanism,
    wordParts,
    method,
    categoryMode: dto.categoryMode,
  };
};

// Helper to convert CheckAnswerResultDto to CheckAnswerResult
const mapCheckAnswerResultDtoToCheckAnswerResult = (dto: CheckAnswerResultDto): CheckAnswerResult => {
  return {
    correct: dto.correct,
    wordsLeft: dto.wordsLeft,
    sessionActive: dto.sessionActive,
    answerDetails: dto.answerDetails.map(detail => ({
      userAnswer: detail.userAnswer,
      correctAnswer: detail.correctAnswer,
      isCorrect: detail.isCorrect,
    })),
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
      .url(`/languages/${languageUuid}/repeat-session`)
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
      .url(`/languages/${languageUuid}/repeat-session`)
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
      .url(`/languages/${languageUuid}/repeat-session/next-word`)
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
    uuid: string,
    form: CheckAnswerForm
  ): Promise<CheckAnswerResult> => {
    const service = new RequestService();

    // Convert method to backend format if it's a Method type
    const formWithConvertedMethod = {
      ...form,
      method: form.method.includes("_") ? form.method : convertMethodToBackendFormat(form.method as Method)
    };

    const request = new RequestBuilder<CheckAnswerForm>()
      .url(`/languages/${languageUuid}/repeat-session/words/${uuid}/check-answer`)
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body(formWithConvertedMethod)
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
      .url(`/languages/${languageUuid}/repeat-session`)
      .method(HttpMethod.DELETE)
      .responseAsVoid()
      .build();

    const res = await service.sendVoid(request);
    throwIfError(res, 'Failed to reset repeat session');
  },
};
