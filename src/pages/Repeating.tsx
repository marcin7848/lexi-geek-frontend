import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WordPart, Method } from "@/types/word";
import { CategoryMode } from "@/types/category";
import { Mic, Volume2 } from "lucide-react";
import { repeatService, type RepeatSession, type RepeatWord } from "@/services/repeatService";
import { languageService, type Language } from "@/services/languageService";
import { toast } from "sonner";
import { authStateService } from "@/services/authStateService";

type Stage = "ANSWER" | "RESULT";

type CheckedWordPart = WordPart & {
  correct?: boolean;
};

export default function Repeating() {
  const { languageId } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language | null>(null);
  const [repeatSession, setRepeatSession] = useState<RepeatSession | null>(null);
  const [currentWord, setCurrentWord] = useState<RepeatWord | null>(null);
  const [currentMethod, setCurrentMethod] = useState<Method>("QuestionToAnswer");
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("DICTIONARY");
  const [specialLetters, setSpecialLetters] = useState<string>("");
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [stage, setStage] = useState<Stage>("ANSWER");
  const [checkedWordParts, setCheckedWordParts] = useState<CheckedWordPart[]>([]);
  const lastFocusedInputRef = useRef<HTMLInputElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const speakerButtonRef = useRef<HTMLButtonElement | null>(null);
  const microphoneButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Initialize auth state to verify authentication
      const user = await authStateService.initialize();
      if (!user) {
        navigate("/login");
        return;
      }

      if (!languageId) return;

      try {
        // Check if languageId is a numeric index or UUID
        const isNumericIndex = /^\d+$/.test(languageId);
        let languageUuid: string;
        let found: Language | null = null;

        if (isNumericIndex) {
          const allLanguages = await languageService.getAll();
          const index = parseInt(languageId) - 1;
          if (index >= 0 && index < allLanguages.length) {
            found = allLanguages[index];
            languageUuid = found.id;
          } else {
            toast.error("Language not found");
            navigate("/");
            return;
          }
        } else {
          found = await languageService.getById(languageId);
          languageUuid = languageId;
        }

        if (!found) {
          toast.error("Language not found");
          navigate("/");
          return;
        }

        setLanguage(found);
        setSpecialLetters(found.specialLetters || "");

        // Load active repeat session
        const session = await repeatService.getActiveSession(languageUuid);
        if (!session) {
          navigate(`/language/${languageId}`);
          return;
        }

        setRepeatSession(session);

        // Load next word
        await loadNextWord(languageUuid);
      } catch (error) {
        console.error("Error loading repeat data:", error);
        toast.error("Failed to load repeat session");
        navigate(`/language/${languageId}`);
      }
    };

    loadData();
  }, [languageId, navigate]);

  const loadNextWord = async (languageUuid: string) => {
    try {
      const word = await repeatService.getNextWord(languageUuid);
      if (!word) {
        toast.error("No more words to repeat");
        navigate(`/language/${languageId}`);
        return;
      }

      setCurrentWord(word);
      setCurrentMethod(word.method);
      setCategoryMode(word.categoryMode as CategoryMode);

      // Log to console
      console.log("Mode:", word.categoryMode);
      console.log("Mechanism:", word.mechanism);
      console.log("Method:", word.method);

      // Reset answers and stage
      setAnswers({});
      setStage("ANSWER");
      setCheckedWordParts([]);
    } catch (error) {
      console.error("Error loading next word:", error);
      toast.error("Failed to load next word");
    }
  };

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

  const handleCheck = async () => {
    if (!currentWord || !language) return;

    if (stage === "ANSWER") {
      // First click: Check answers with backend
      try {
        const result = await repeatService.checkAnswer(language.id, currentWord.uuid, {
          answers,
          method: currentMethod,
        });

        // Update session with new wordsLeft
        if (repeatSession) {
          setRepeatSession({
            ...repeatSession,
            wordsLeft: result.wordsLeft,
          });
        }

        // Build answerDetailsMap from the server response
        // The answerDetails array contains results for all answer parts in order
        const sortedParts = [...currentWord.wordParts].sort((a, b) => a.position - b.position);
        const inputParts = sortedParts.filter(p =>
          (currentMethod === "QuestionToAnswer" ? p.answer : !p.answer) && !p.isSeparator
        );

        const detailsMap: { [position: string]: boolean } = {};
        inputParts.forEach((part, index) => {
          if (result.answerDetails[index]) {
            detailsMap[part.position.toString()] = result.answerDetails[index].isCorrect;
          }
        });

        // Prepare checked word parts for display in RESULT stage
        const checked: CheckedWordPart[] = sortedParts.map(part => {
          const isInput = inputParts.some(p => p.position === part.position);
          if (isInput) {
            const correct = detailsMap[part.position.toString()] || false;
            return { ...part, correct };
          }
          return part;
        });

        setCheckedWordParts(checked);
        setStage("RESULT");

        // Check if session is still active
        if (!result.sessionActive) {
          // Session completed, but we'll navigate after user clicks "Next"
          // (they can still see the result)
        }
      } catch (error) {
        console.error("Error checking answer:", error);
        toast.error("Failed to check answer");
      }
    } else {
      // Second click (RESULT stage): Load next word or finish session
      try {
        if (repeatSession && repeatSession.wordsLeft > 0) {
          await loadNextWord(language.id);
        } else {
          // Session completed
          toast.success("Repeat session completed!");
          navigate(`/language/${languageId}`);
        }
      } catch (error) {
        console.error("Error loading next word:", error);
        toast.error("Failed to load next word");
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

    // Helper to render separator
    const renderSeparator = (part: WordPart) => {
      if (part.separatorType === "ENTER") {
        return <div key={part.position} className="w-full" />;
      } else if (part.separatorType === "TAB") {
        return <span key={part.position} className="inline-block w-8">{part.basicWord}</span>;
      } else if (part.separatorType === "MULTI_DASH") {
        return <span key={part.position} className="mx-1">{part.basicWord}</span>;
      }
      return null;
    };

    // In RESULT stage, always show all parts with word and basicWord
    if (stage === "RESULT") {
      return (
        <div className="flex flex-wrap gap-2 items-center">
          {sortedParts.map((part) => {
            if (part.isSeparator) {
              return renderSeparator(part);
            }
            
            const checkedPart = part as CheckedWordPart;
            const hasCorrectProperty = checkedPart.correct !== undefined;
            
            return (
              <span key={part.position} className="inline-flex items-center gap-1">
                <span className={hasCorrectProperty 
                  ? `px-2 py-1 rounded ${checkedPart.correct ? 'bg-green-500/20' : 'bg-red-500/20'}`
                  : ''
                }>
                  {part.word}
                </span>
                {part.basicWord && (
                  <span className="text-muted-foreground text-sm">({part.basicWord})</span>
                )}
              </span>
            );
          })}
        </div>
      );
    }

    // ANSWER stage logic based on Mode, Mechanism, Method
    const mode = categoryMode;
    const method = currentMethod;

    // Helper to shuffle array (for random order)
    const shuffle = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Determine behaviors based on combination
    let showBox = false;
    let boxParts: WordPart[] = [];
    let boxDisplayType: 'word-with-basic' | 'basic-only' = 'word-with-basic';
    const belowParts: WordPart[] = sortedParts;
    let inputAnswerValue: boolean = true;

    if (mode === "DICTIONARY" && mechanism === "BASIC" && method === "QuestionToAnswer") {
      // J, F
      // QuestionToAnswer: Display questions (answer: false), Input answers (answer: true)
      showBox = false;
      inputAnswerValue = true;
    } else if (mode === "DICTIONARY" && mechanism === "BASIC" && method === "AnswerToQuestion") {
      // J, G
      // AnswerToQuestion: Display answers (answer: true), Input questions (answer: false)
      showBox = false;
      inputAnswerValue = false;
    } else if (mode === "DICTIONARY" && mechanism === "TABLE" && method === "QuestionToAnswer") {
      // A, B, F
      // QuestionToAnswer: Input answers (answer: true), so box shows answers
      showBox = true;
      boxParts = shuffle(sortedParts.filter(p => p.answer && !p.isSeparator));
      boxDisplayType = 'word-with-basic';
      inputAnswerValue = true;
    } else if (mode === "DICTIONARY" && mechanism === "TABLE" && method === "AnswerToQuestion") {
      // A, D, G
      // AnswerToQuestion: Input questions (answer: false), so box shows questions
      showBox = true;
      boxParts = shuffle(sortedParts.filter(p => !p.answer && !p.isSeparator));
      boxDisplayType = 'word-with-basic';
      inputAnswerValue = false;
    } else if (mode === "EXERCISE" && mechanism === "BASIC" && method === "QuestionToAnswer") {
      // J, I
      showBox = false;
      inputAnswerValue = true;
    } else if (mode === "EXERCISE" && mechanism === "BASIC" && method === "AnswerToQuestion") {
      // J, H
      showBox = false;
      inputAnswerValue = false;
    } else if (mode === "EXERCISE" && mechanism === "TABLE" && method === "QuestionToAnswer") {
      // A, C, F
      // QuestionToAnswer: Input answers (answer: true), so box shows answers (basicWord only)
      showBox = true;
      boxParts = shuffle(sortedParts.filter(p => p.answer && !p.isSeparator));
      boxDisplayType = 'basic-only';
      inputAnswerValue = true;
    } else if (mode === "EXERCISE" && mechanism === "TABLE" && method === "AnswerToQuestion") {
      // A, E, G
      // AnswerToQuestion: Input questions (answer: false), so box shows questions (basicWord only)
      showBox = true;
      boxParts = shuffle(sortedParts.filter(p => !p.answer && !p.isSeparator));
      boxDisplayType = 'basic-only';
      inputAnswerValue = false;
    }

    // Normalize TABLE box parts to match inputAnswerValue to avoid inversion bugs
    if (showBox && mechanism === "TABLE") {
      boxParts = shuffle(sortedParts.filter(p => (p.answer === inputAnswerValue && !p.isSeparator)));
    }

    // Render box if needed
    const boxElement = showBox ? (
      <div className="border rounded-lg p-4 flex flex-wrap gap-4 mb-4">
        {boxParts.map((part, idx) => (
          <span
            key={`box-${part.position}-${idx}`}
            className="px-3 py-1 hover:bg-accent/50 rounded cursor-pointer transition-colors"
          >
            {boxDisplayType === 'word-with-basic' ? (
              <>
                {part.word}
                {part.basicWord && (
                  <span className="text-muted-foreground text-sm ml-1">({part.basicWord})</span>
                )}
              </>
            ) : (
              part.basicWord ? part.basicWord : null
            )}
          </span>
        ))}
      </div>
    ) : null;

    // Render below parts with inputs
    const belowElement = (
      <div className="flex flex-wrap gap-2 items-center">
        {belowParts.map((part, idx) => {
          // Check if it's a separator first
          if (part.isSeparator) {
            return renderSeparator(part);
          }
          
          const isInput = part.answer === inputAnswerValue;
          const isFirstInput = idx === belowParts.findIndex(p => p.answer === inputAnswerValue && !p.isSeparator);
          
          if (isInput) {
            // Determine if we show basicWord next to input based on mode and mechanism (H/I only for Exercise BASIC)
            const showBasicNextToInput = mode === "EXERCISE" && mechanism === "BASIC";

            return (
              <span key={part.position} className="inline-flex items-center gap-1">
                <Input
                  ref={isFirstInput ? firstInputRef : null}
                  data-answer-input
                  data-part-id={part.position.toString()}
                  value={answers[part.position.toString()] || ""}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [part.position.toString()]: e.target.value }))}
                  onFocus={(e) => lastFocusedInputRef.current = e.target}
                  onKeyDown={handleKeyDown}
                  className="w-40 inline-block"
                />
                {showBasicNextToInput && part.basicWord && (
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

    return (
      <div>
        {boxElement}
        {belowElement}
      </div>
    );
  };

  if (!repeatSession) {
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
            Words left: {repeatSession.wordsLeft}
          </div>

          {stage === "ANSWER" && specialLetters && (
            <div className="flex flex-wrap gap-2 border rounded-lg p-4">
              {specialLetters.split(",").map((letter, idx) => (
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
