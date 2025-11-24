export type Mechanism = "BASIC" | "TABLE";
export type Method = "QuestionToAnswer" | "AnswerToQuestion";
export type SeparatorType = "ENTER" | "TAB" | "MULTI_DASH";

export interface WordPart {
  answer: boolean;
  basicWord: string;
  position: number;
  toSpeech: boolean;
  word: string;
  isSeparator?: boolean;
  separatorType?: SeparatorType;
}

export interface WordStat {
  timestampRepeated: number;
  toAnswer: number;
  answered: number;
  method: Method;
}

export interface Word {
  id: number;
  uuid?: string; // UUID from backend
  accepted: boolean;
  comment: string;
  resetTimestamp: number | null;
  mechanism: Mechanism;
  chosen: boolean;
  toRepeat: boolean;
  repeated: number;
  lastTimestampRepeated: number | null;
  created: number;
  wordParts: WordPart[];
  wordStats: WordStat[];
  inCategories: string[];
}
