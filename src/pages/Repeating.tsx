import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Word, WordPart, Method } from "@/types/word";
import { Category, CategoryMode } from "@/types/category";
import { Mic, Volume2 } from "lucide-react";
import { repeatService } from "@/services/repeatService";

type RepeatData = {
  active: boolean;
  wordsLeft: number;
};

type Stage = "ANSWER" | "RESULT";

type CheckedWordPart = WordPart & {
  correct?: boolean;
};

export default function Repeating() {
  const { languageId } = useParams();
  const navigate = useNavigate();
  const [repeatData, setRepeatData] = useState<RepeatData>({ active: false, wordsLeft: 0 });
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentMethod, setCurrentMethod] = useState<Method>("FirstToSecond");
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("Dictionary");
  const [specialLetters, setSpecialLetters] = useState<string>("");
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [stage, setStage] = useState<Stage>("ANSWER");
  const [checkedWordParts, setCheckedWordParts] = useState<CheckedWordPart[]>([]);
  const lastFocusedInputRef = useRef<HTMLInputElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const speakerButtonRef = useRef<HTMLButtonElement | null>(null);
  const microphoneButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Load repeat data
    const storageKey = `repeat_${languageId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      setRepeatData(data);

      if (data.active) {
        loadWord();
      }
    }

    // Load language special letters
    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    const language = languages.find((l: any) => l.id === languageId);
    if (language) {
      setSpecialLetters(language.specialLetters || "");
    }
  }, [languageId]);

  useEffect(() => {
    if (firstInputRef.current && currentWord && stage === "ANSWER") {
      firstInputRef.current.focus();
    }
  }, [currentWord, stage]);

  // Auto-click microphone when entering ANSWER stage
  useEffect(() => {
    if (stage === "ANSWER" && microphoneButtonRef.current && currentWord) {
      console.log("Auto-triggering microphone (ANSWER stage loaded)");
      microphoneButtonRef.current.click();
    }
  }, [stage, currentWord]);

  // Auto-click speaker when entering RESULT stage
  useEffect(() => {
    if (stage === "RESULT" && speakerButtonRef.current) {
      console.log("Auto-triggering speaker (RESULT stage loaded)");
      speakerButtonRef.current.click();
    }
  }, [stage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: Event) => {
      const keyEvent = e as unknown as globalThis.KeyboardEvent;
      if (keyEvent.ctrlKey && keyEvent.key === ";") {
        keyEvent.preventDefault();
        if (stage === "RESULT" && speakerButtonRef.current) {
          console.log("Speaker triggered by Ctrl+;");
          speakerButtonRef.current.click();
        } else if (stage === "ANSWER" && microphoneButtonRef.current) {
          console.log("Microphone triggered by Ctrl+;");
          microphoneButtonRef.current.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [stage]);

  const loadWord = () => {
    // Load random word from any category in the language
    const storageKey = `categories_${languageId}`;
    const storedCategories = localStorage.getItem(storageKey);
    
    if (!storedCategories) return;

    const categories: Category[] = JSON.parse(storedCategories);
    
    // Get all words from all categories
    let allWords: Word[] = [];
    categories.forEach(category => {
      const wordsKey = `words_${category.id}`;
      const storedWords = localStorage.getItem(wordsKey);
      if (storedWords) {
        const words: Word[] = JSON.parse(storedWords);
        allWords = allWords.concat(words.map(w => ({ ...w, categoryMode: category.mode })));
      }
    });

    if (allWords.length === 0) return;

    // Pick random word
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    setCurrentWord(randomWord);

    // Get category mode
    const wordCategory = categories.find(c => {
      const wordsKey = `words_${c.id}`;
      const storedWords = localStorage.getItem(wordsKey);
      if (storedWords) {
        const words: Word[] = JSON.parse(storedWords);
        return words.some(w => w.id === randomWord.id);
      }
      return false;
    });
    
    if (wordCategory) {
      setCategoryMode(wordCategory.mode);
    }

    // Randomly choose method (never BothSides)
    const method = Math.random() > 0.5 ? "FirstToSecond" : "SecondToFirst";
    setCurrentMethod(method);

    // Log to console
    console.log("Mode:", wordCategory?.mode || "Unknown");
    console.log("Mechanism:", randomWord.mechanism);
    console.log("Method:", method);

    // Reset answers and stage
    setAnswers({});
    setStage("ANSWER");
    setCheckedWordParts([]);
  };

  const handleCheck = async () => {
    if (!currentWord) return;

    if (stage === "ANSWER") {
      // Check answers and move to RESULT stage
      const sortedParts = [...currentWord.wordParts].sort((a, b) => a.position - b.position);
      const inputParts = currentMethod === "FirstToSecond"
        ? sortedParts.filter(p => p.answer)
        : sortedParts.filter(p => !p.answer);

      const checked: CheckedWordPart[] = sortedParts.map(part => {
        const isInput = inputParts.some(p => p.position === part.position);
        if (isInput) {
          const userAnswer = answers[part.position.toString()] || "";
          const correct = userAnswer.toLowerCase() === part.word.toLowerCase();
          return { ...part, correct };
        }
        return part;
      });

      setCheckedWordParts(checked);
      setStage("RESULT");
    } else {
      // Send simulated request
      await repeatService.checkAnswer({
        wordId: currentWord.id,
        answers,
      });

      // Refresh page - reload repeat data and new word
      const storageKey = `repeat_${languageId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        setRepeatData(data);
        
        if (data.active) {
          loadWord();
        }
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheck();
    } else if (e.key === "Tab") {
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-answer-input]'));
      const currentIndex = inputs.indexOf(e.currentTarget);
      
      if (currentIndex !== -1) {
        e.preventDefault();
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + inputs.length) % inputs.length
          : (currentIndex + 1) % inputs.length;
        inputs[nextIndex]?.focus();
      }
    }
  };

  // Global Enter key handler for RESULT stage
  useEffect(() => {
    const handleGlobalKeyDown = (e: Event) => {
      const keyEvent = e as unknown as globalThis.KeyboardEvent;
      const target = keyEvent.target as HTMLElement;
      // Only trigger if Enter is pressed in RESULT stage and NOT in an input field
      if (keyEvent.key === "Enter" && stage === "RESULT" && target.tagName !== "INPUT") {
        keyEvent.preventDefault();
        handleCheck();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [stage]);

  const insertSpecialLetter = (letter: string) => {
    const targetInput = lastFocusedInputRef.current;
    if (!targetInput) return;

    const start = targetInput.selectionStart || 0;
    const end = targetInput.selectionEnd || 0;
    const currentValue = targetInput.value;
    const newValue = currentValue.slice(0, start) + letter + currentValue.slice(end);
    
    const partId = targetInput.dataset.partId;
    if (partId) {
      setAnswers(prev => ({ ...prev, [partId]: newValue }));
      
      setTimeout(() => {
        targetInput.focus();
        targetInput.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  };

  const renderWordParts = () => {
    if (!currentWord) return null;

    const partsToUse = stage === "RESULT" ? checkedWordParts : currentWord.wordParts;
    const sortedParts = [...partsToUse].sort((a, b) => a.position - b.position);
    const mechanism = currentWord.mechanism;

    // Determine which parts are shown and which need inputs
    let shownParts: WordPart[] = [];
    let inputParts: WordPart[] = [];

    if (currentMethod === "FirstToSecond") {
      shownParts = sortedParts.filter(p => !p.answer);
      inputParts = sortedParts.filter(p => p.answer);
    } else {
      shownParts = sortedParts.filter(p => p.answer);
      inputParts = sortedParts.filter(p => !p.answer);
    }

    if (mechanism === "BASIC") {
      // BASIC mechanism
      return (
        <div className="flex flex-wrap gap-2 items-center">
          {sortedParts.map((part, idx) => {
            const isInput = inputParts.some(p => p.position === part.position);
            const checkedPart = part as CheckedWordPart;
            
            if (isInput) {
              if (stage === "RESULT") {
                return (
                  <span key={part.position} className="inline-flex items-center gap-1">
                    <span className={`px-2 py-1 rounded ${checkedPart.correct ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {part.word}
                    </span>
                    {part.basicWord && (
                      <span className="text-muted-foreground text-sm">({part.basicWord})</span>
                    )}
                  </span>
                );
              }
              return (
                <span key={part.position} className="inline-flex items-center gap-1">
                  <Input
                    ref={idx === sortedParts.findIndex(p => inputParts.some(ip => ip.position === p.position)) ? firstInputRef : null}
                    data-answer-input
                    data-part-id={part.position.toString()}
                    value={answers[part.position.toString()] || ""}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [part.position.toString()]: e.target.value }))}
                    onFocus={(e) => lastFocusedInputRef.current = e.target}
                    onKeyDown={handleKeyDown}
                    className="w-40 inline-block"
                  />
                  {part.basicWord && (
                    <span className="text-muted-foreground text-sm">({part.basicWord})</span>
                  )}
                </span>
              );
            } else {
              return (
                <span key={part.position} className="inline-flex items-center gap-1">
                  <span>{part.word}</span>
                  {part.basicWord && (
                    <span className="text-muted-foreground text-sm">({part.basicWord})</span>
                  )}
                </span>
              );
            }
          })}
        </div>
      );
    } else {
      // TABLE mechanism
      if (categoryMode === "Dictionary") {
        return (
          <div className="space-y-4">
            {stage === "ANSWER" && (
              <div className="border rounded-lg p-4 flex flex-wrap gap-4">
                {shownParts.map(part => (
                  <span
                    key={part.position}
                    className="px-3 py-1 hover:bg-accent/50 rounded cursor-pointer transition-colors"
                  >
                    {part.word}
                    {part.basicWord && (
                      <span className="text-muted-foreground text-sm ml-1">({part.basicWord})</span>
                    )}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 items-center">
              {sortedParts.map((part, idx) => {
                const isInput = inputParts.some(p => p.position === part.position);
                const checkedPart = part as CheckedWordPart;
                
                if (isInput) {
                  if (stage === "RESULT") {
                    return (
                      <span key={part.position} className="inline-flex items-center gap-1">
                        <span className={`px-2 py-1 rounded ${checkedPart.correct ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {part.word}
                        </span>
                      </span>
                    );
                  }
                  return (
                    <span key={part.position} className="inline-flex items-center gap-1">
                      <Input
                        ref={idx === sortedParts.findIndex(p => inputParts.some(ip => ip.position === p.position)) ? firstInputRef : null}
                        data-answer-input
                        data-part-id={part.position.toString()}
                        value={answers[part.position.toString()] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [part.position.toString()]: e.target.value }))}
                        onFocus={(e) => lastFocusedInputRef.current = e.target}
                        onKeyDown={handleKeyDown}
                        className="w-40 inline-block"
                      />
                    </span>
                  );
                } else {
                  return (
                    <span key={part.position} className="inline-flex items-center gap-1">
                      <span>{part.word}</span>
                      {part.basicWord && (
                        <span className="text-muted-foreground text-sm">({part.basicWord})</span>
                      )}
                    </span>
                  );
                }
              })}
            </div>
          </div>
        );
      } else {
        // Exercise mode - only show basicWord in the box
        return (
          <div className="space-y-4">
            {stage === "ANSWER" && (
              <div className="border rounded-lg p-4 flex flex-wrap gap-4">
                {shownParts.map(part => (
                  part.basicWord && (
                    <span
                      key={part.position}
                      className="px-3 py-1 hover:bg-accent/50 rounded cursor-pointer transition-colors"
                    >
                      {part.basicWord}
                    </span>
                  )
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 items-center">
              {sortedParts.map((part, idx) => {
                const isInput = inputParts.some(p => p.position === part.position);
                const checkedPart = part as CheckedWordPart;
                
                if (isInput) {
                  if (stage === "RESULT") {
                    return (
                      <span key={part.position} className="inline-flex items-center gap-1">
                        <span className={`px-2 py-1 rounded ${checkedPart.correct ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {part.word}
                        </span>
                      </span>
                    );
                  }
                  return (
                    <span key={part.position} className="inline-flex items-center gap-1">
                      <Input
                        ref={idx === sortedParts.findIndex(p => inputParts.some(ip => ip.position === p.position)) ? firstInputRef : null}
                        data-answer-input
                        data-part-id={part.position.toString()}
                        value={answers[part.position.toString()] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [part.position.toString()]: e.target.value }))}
                        onFocus={(e) => lastFocusedInputRef.current = e.target}
                        onKeyDown={handleKeyDown}
                        className="w-40 inline-block"
                      />
                    </span>
                  );
                } else {
                  return (
                    <span key={part.position} className="inline-flex items-center gap-1">
                      <span>{part.word}</span>
                      {part.basicWord && (
                        <span className="text-muted-foreground text-sm">({part.basicWord})</span>
                      )}
                    </span>
                  );
                }
              })}
            </div>
          </div>
        );
      }
    }
  };

  if (!repeatData.active) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />
        <main className="pt-16 px-4 md:px-8 max-w-[95%] mx-auto">
          <div className="py-8 space-y-6">
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-4">Repeating finished</h1>
              <Button onClick={() => navigate(`/language/${languageId}`)}>
                Back to language
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-[95%] mx-auto">
        <div className="py-8 space-y-6 max-w-4xl">
          <h1 className="text-3xl font-bold">Repeating</h1>
          
          <div className="text-xl font-semibold">
            Words left: {repeatData.wordsLeft}
          </div>

          {stage === "ANSWER" && specialLetters && (
            <div className="flex flex-wrap gap-2 border rounded-lg p-4">
              {specialLetters.split("").map((letter, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => insertSpecialLetter(letter)}
                >
                  {letter}
                </Button>
              ))}
            </div>
          )}

          {stage === "ANSWER" && (
            <div className="flex gap-4">
              <Button 
                ref={microphoneButtonRef}
                variant="outline" 
                size="icon"
                onClick={() => console.log("Microphone clicked manually")}
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>
          )}

          {stage === "RESULT" && (
            <div className="flex gap-4">
              <Button 
                ref={speakerButtonRef}
                variant="outline" 
                size="icon"
                onClick={() => console.log("Speaker clicked manually")}
              >
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>
          )}

          {currentWord && (
            <div className="space-y-6">
              {currentWord.comment && (
                <div className="text-muted-foreground italic">
                  {currentWord.comment}
                </div>
              )}

              <div className="border rounded-lg p-6 space-y-4">
                {renderWordParts()}
                
                <div className="flex justify-end">
                  <Button onClick={handleCheck} size="lg">
                    {stage === "ANSWER" ? "Check" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
