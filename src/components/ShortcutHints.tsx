import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface ShortcutUsage {
  shortcut: string;
  name: string;
  usage: number;
}

const getMockShortcutUsage = (): ShortcutUsage[] => {
  const storageKey = "shortcutUsage";
  const stored = localStorage.getItem(storageKey);
  
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with mock data
  const mockData: ShortcutUsage[] = [
    { shortcut: "en", name: "English", usage: 150 },
    { shortcut: "es", name: "Spanish", usage: 120 },
    { shortcut: "fr", name: "French", usage: 95 },
    { shortcut: "de", name: "German", usage: 85 },
    { shortcut: "it", name: "Italian", usage: 70 },
    { shortcut: "pt", name: "Portuguese", usage: 65 },
    { shortcut: "ru", name: "Russian", usage: 55 },
    { shortcut: "ja", name: "Japanese", usage: 50 },
    { shortcut: "zh", name: "Chinese", usage: 45 },
    { shortcut: "ko", name: "Korean", usage: 40 },
    { shortcut: "ar", name: "Arabic", usage: 35 },
    { shortcut: "hi", name: "Hindi", usage: 30 },
    { shortcut: "pl", name: "Polish", usage: 25 },
    { shortcut: "nl", name: "Dutch", usage: 20 },
    { shortcut: "sv", name: "Swedish", usage: 15 },
  ];
  
  localStorage.setItem(storageKey, JSON.stringify(mockData));
  return mockData;
};

interface ShortcutHintsProps {
  value: string;
  onSelect: (shortcut: string) => void;
  onHide: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function ShortcutHints({ value, onSelect, onHide, inputRef }: ShortcutHintsProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutUsage[]>([]);
  const hintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allShortcuts = getMockShortcutUsage();
    
    if (value === "") {
      // Show top 10 most popular shortcuts
      const topShortcuts = [...allShortcuts]
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 10);
      setShortcuts(topShortcuts);
    } else {
      // Filter shortcuts that contain the typed letters
      const filtered = allShortcuts
        .filter(s => s.shortcut.toLowerCase().includes(value.toLowerCase()))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 10);
      setShortcuts(filtered);
    }
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
              {item.usage} uses
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
