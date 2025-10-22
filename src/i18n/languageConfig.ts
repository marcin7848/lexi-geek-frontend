import { Language } from "./translations";

export const languageOptions: Array<{
  code: Language;
  name: string;
  flag: string;
}> = [
  { code: "en", name: "English", flag: "EN" },
  { code: "pl", name: "Polish", flag: "PL" },
  { code: "de", name: "German", flag: "DE" },
  { code: "es", name: "Spanish", flag: "ES" },
  { code: "fr", name: "French", flag: "FR" },
];
