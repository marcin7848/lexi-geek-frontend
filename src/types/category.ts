export type CategoryMode = "Dictionary" | "Exercise";
export type CategoryMethod = "FirstToSecond" | "SecondToFirst" | "BothSides";

export type Category = {
  id: number;
  id_parent: number | null;
  name: string;
  mode: CategoryMode;
  method: CategoryMethod;
  order: number;
};
