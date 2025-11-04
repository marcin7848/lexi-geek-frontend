export type CategoryMode = "DICTIONARY" | "EXERCISE";
export type CategoryMethod = "QUESTION_TO_ANSWER" | "ANSWER_TO_QUESTION" | "BOTH";

export type Category = {
  uuid: string;
  parentUuid: string | null;
  name: string;
  mode: CategoryMode;
  method: CategoryMethod;
  position: number;
};
