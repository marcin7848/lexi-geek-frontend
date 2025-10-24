import { Language } from "./translations";

export const languageOptions: Array<{
  code: Language;
  name: string;
  countryCode: string;
}> = [
  { code: "en", name: "English", countryCode: "us" },
  { code: "pl", name: "Polish", countryCode: "pl" },
  { code: "de", name: "German", countryCode: "de" },
  { code: "es", name: "Spanish", countryCode: "es" },
  { code: "fr", name: "French", countryCode: "fr" },
];
