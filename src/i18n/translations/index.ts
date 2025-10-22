import { en } from "./en";
import { pl } from "./pl";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";

export const translations = {
  en,
  pl,
  de,
  es,
  fr,
};

export type Language = keyof typeof translations;
export type TranslationKeys = keyof typeof en;
