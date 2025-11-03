import { createContext, useContext, useEffect, useState } from "react";
import { translations, Language, TranslationKeys } from "./translations";

type LanguageProviderProps = {
  children: React.ReactNode;
  defaultLanguage?: Language;
};

type LanguageProviderState = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, ...args: unknown[]) => string;
};

const LanguageProviderContext = createContext<LanguageProviderState | undefined>(
  undefined
);

export function LanguageProvider({
  children,
  defaultLanguage = "en",
}: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem("language") as Language) || defaultLanguage
  );

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string, ...args: unknown[]): string => {
    const template = (translations[language] as Record<string, string>)[key] || key;
    if (!args || args.length === 0) return template;
    // Simple %s placeholder replacement
    let i = 0;
    return template.replace(/%s/g, () => String(args[i++] ?? ''));
  };

  return (
    <LanguageProviderContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageProviderContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageProviderContext);
  if (context === undefined)
    throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
