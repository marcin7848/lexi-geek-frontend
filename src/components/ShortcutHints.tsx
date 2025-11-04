import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageProvider";
import { languageService, type ShortcutDto } from "@/services/languageService";

interface ShortcutHintsProps {
  value: string;
  onSelect: (shortcut: string) => void;
  onHide: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function ShortcutHints({ value, onSelect, onHide, inputRef }: ShortcutHintsProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutDto[]>([]);
  const hintsRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const loadShortcuts = async () => {
      try {
        // Pass the filter value to the API - if empty, backend will return all popular shortcuts
        const data = await languageService.getPopularShortcuts(value || undefined);
        setShortcuts(data);
      } catch (error) {
        console.error("Failed to load shortcuts:", error);
        setShortcuts([]);
      }
    };

    loadShortcuts();
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hintsRef.current &&
        !hintsRef.current.contains(event.target as Node) &&
        inputRef?.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        onHide();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputRef, onHide]);

  if (shortcuts.length === 0) {
    return null;
  }

  return (
    <Card ref={hintsRef} className="absolute z-50 mt-1 w-full max-h-60 overflow-auto">
      <div className="p-2">
        {shortcuts.map((item) => (
          <div
            key={item.shortcut}
            onClick={() => {
              onSelect(item.shortcut);
              onHide();
            }}
            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent rounded-md transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.shortcut}</span>
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {item.usage} {t("shortcutHints.uses")}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
