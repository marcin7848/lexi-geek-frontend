export type Mechanism = "BASIC" | "TABLE";
export type Method = "FirstToSecond" | "SecondToFirst";

export interface WordPart {
  answer: boolean;
  basicWord: string;
  position: number;
  toSpeech: boolean;
  word: string;
}

export interface WordStat {
  timestampRepeated: number;
  toAnswer: number;
  answered: number;
  method: Method;
}

export interface Word {
  id: number;
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
}
