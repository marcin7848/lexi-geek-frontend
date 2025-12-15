import { useEffect, useState, useRef, KeyboardEvent, useCallback } from "react";
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
  const [shuffledBoxParts, setShuffledBoxParts] = useState<WordPart[]>([]);
  const lastFocusedInputRef = useRef<HTMLInputElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const speakerButtonRef = useRef<HTMLButtonElement | null>(null);
  const microphoneButtonRef = useRef<HTMLButtonElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const checkButtonRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestartRef = useRef<boolean>(true);
  const stageRef = useRef<Stage>(stage);
  const isRecognitionReadyRef = useRef<boolean>(false);
  const isProcessingCommandRef = useRef<boolean>(false);

  // Initialize microphone and headphones state from localStorage (default: true)
  const [isMicrophoneOn, setIsMicrophoneOn] = useState<boolean>(() => {
    const stored = localStorage.getItem("repeating-microphone");
    return stored === null ? true : stored === "true";
  });

  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  const [isHeadphonesOn, setIsHeadphonesOn] = useState<boolean>(() => {
    const stored = localStorage.getItem("repeating-headphones");
    return stored === null ? true : stored === "true";
  });

  // Refs that depend on state values must be declared after state
  const languageRef = useRef<Language | null>(language);
  const isMicrophoneOnRef = useRef<boolean>(isMicrophoneOn);

  // Save microphone state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("repeating-microphone", isMicrophoneOn.toString());
  }, [isMicrophoneOn]);

  // Save headphones state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("repeating-headphones", isHeadphonesOn.toString());
  }, [isHeadphonesOn]);

  // Keep stageRef in sync with stage
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  // Keep languageRef in sync with language
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Keep isMicrophoneOnRef in sync with isMicrophoneOn
  useEffect(() => {
    isMicrophoneOnRef.current = isMicrophoneOn;
  }, [isMicrophoneOn]);

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

      // Initialize shuffled box parts for TABLE mechanism
      const sortedParts = [...word.wordParts].sort((a, b) => a.position - b.position);
      const shuffle = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Determine which parts to shuffle based on method
      let partsToShuffle: WordPart[] = [];
      if (word.mechanism === "TABLE") {
        const inputAnswerValue = word.method === "QuestionToAnswer";
        partsToShuffle = shuffle(sortedParts.filter(p => (p.answer === inputAnswerValue && !p.isSeparator)));
      }
      setShuffledBoxParts(partsToShuffle);
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

  // Function to speak wordParts with answer:true
  const speakAnswerParts = useCallback(() => {
    if (!isHeadphonesOn || !currentWord || !language) return;

    const sortedParts = [...currentWord.wordParts].sort((a, b) => a.position - b.position);
    const answerParts = sortedParts.filter(p => p.answer && !p.isSeparator);

    if (answerParts.length === 0) return;

    const textToSpeak = answerParts.map(p => p.word).join(" ");
    const speechLang = language.codeForSpeech || "en-US";

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = speechLang;
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  }, [isHeadphonesOn, currentWord, language]);

  // Speech recognition setup
  const startListening = useCallback(() => {
    const language = languageRef.current;
    const isMicrophoneOn = isMicrophoneOnRef.current;

    if (!language || !isMicrophoneOn) {
      console.log("Cannot start listening - missing language or microphone off");
      return;
    }

    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    if (recognitionRef.current) {
      try {
        shouldRestartRef.current = false;
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Error stopping previous recognition:", e);
      }
      recognitionRef.current = null;
    }

    shouldRestartRef.current = true;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Enable interim results for live display
    recognition.lang = language.codeForSpeech || "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript(""); // Clear interim text when starting
      console.log("Speech recognition started for stage:", stageRef.current);
      // Mark as ready after a brief delay to ensure it's fully listening
      setTimeout(() => {
        isRecognitionReadyRef.current = true;
        console.log("Recognition now ready to accept commands");
      }, 200);
    };

    recognition.onresult = (event: any) => {
      let interimText = "";
      let finalTranscript = "";

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimText += transcript;
        }
      }

      // Update interim display
      if (interimText) {
        setInterimTranscript(interimText.trim());
      }

      // Only process final results
      if (!finalTranscript) return;

      const transcript = finalTranscript.trim();
      const currentStage = stageRef.current;
      console.log("Recognized:", transcript, "Stage:", currentStage, "Ready:", isRecognitionReadyRef.current);

      // Clear interim text after final result
      setInterimTranscript("");

      // For commands, ensure recognition is ready to prevent missing commands during transitions
      const isCommand = transcript.toLowerCase() === "next" ||
                        transcript.toLowerCase() === "next." ||
                        transcript.toLowerCase() === "switch" ||
                        transcript.toLowerCase() === "switch.";

      if (isCommand && !isRecognitionReadyRef.current) {
        console.log("Command received but recognition not ready yet, will try to process anyway");
      }

      // Check for "next" command in English (regardless of language setting)
      if (transcript.toLowerCase() === "next" || transcript.toLowerCase() === "next.") {
        console.log("Next command recognized in stage:", currentStage);
        isProcessingCommandRef.current = true;
        if (checkButtonRef.current) {
          checkButtonRef.current.click();
        }
        // Clear the processing flag after a short delay to allow stage transition
        setTimeout(() => {
          isProcessingCommandRef.current = false;
        }, 150);
        return;
      }

      // Check for "switch" command to move to next input (Tab simulation)
      if (transcript.toLowerCase() === "switch" || transcript.toLowerCase() === "switch.") {
        console.log("Switch command recognized - simulating Tab");
        isProcessingCommandRef.current = true;
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-answer-input]'));
        const currentInput = lastFocusedInputRef.current;

        if (currentInput && inputs.length > 0) {
          const currentIndex = inputs.indexOf(currentInput);
          if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % inputs.length;
            inputs[nextIndex]?.focus();
            lastFocusedInputRef.current = inputs[nextIndex];
          }
        } else if (inputs.length > 0) {
          // If no input is focused, focus the first one
          inputs[0]?.focus();
          lastFocusedInputRef.current = inputs[0];
        }
        setTimeout(() => {
          isProcessingCommandRef.current = false;
        }, 100);
        return;
      }

      // Insert transcribed text into the currently focused input (only in ANSWER stage)
      if (currentStage === "ANSWER" && lastFocusedInputRef.current) {
        const targetInput = lastFocusedInputRef.current;
        const start = targetInput.selectionStart || 0;
        const end = targetInput.selectionEnd || 0;
        const currentValue = targetInput.value;
        const newValue = currentValue.slice(0, start) + transcript + currentValue.slice(end);

        const partId = targetInput.dataset.partId;
        if (partId) {
          setAnswers(prev => ({ ...prev, [partId]: newValue }));

          setTimeout(() => {
            targetInput.focus();
            const newCursorPos = start + transcript.length;
            targetInput.setSelectionRange(newCursorPos, newCursorPos);
          }, 0);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'aborted') {
        // Don't restart on aborted error
        shouldRestartRef.current = false;
        return;
      }
      if (event.error !== 'no-speech') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      isRecognitionReadyRef.current = false; // Mark as not ready when ending
      const currentMicState = isMicrophoneOnRef.current;
      const currentLanguage = languageRef.current;
      console.log("Speech recognition ended. shouldRestart:", shouldRestartRef.current, "microphone:", currentMicState);

      // Only restart if we should and microphone is still on
      if (shouldRestartRef.current && currentMicState && currentLanguage) {
        setTimeout(() => {
          console.log("Restarting recognition...");
          startListening();
        }, 100); // Reduced from 500ms to 100ms for faster restart
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      console.log("Recognition start called");
    } catch (error) {
      console.error("Failed to start recognition:", error);
      shouldRestartRef.current = false;
    }
  }, []); // No dependencies - completely stable!


  const stopListening = useCallback(() => {
    console.log("stopListening called");
    shouldRestartRef.current = false;
    isRecognitionReadyRef.current = false; // Mark as not ready when stopping
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Error stopping recognition:", e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript(""); // Clear interim text when stopping
  }, []);

  // Start/stop listening based on microphone state
  useEffect(() => {
    if (isMicrophoneOn && language) {
      // Only start if not already listening
      if (!recognitionRef.current) {
        console.log("Starting listening - no active recognition");
        startListening();
      } else {
        console.log("Recognition already active, not restarting");
      }
    } else {
      console.log("Stopping listening - microphone:", isMicrophoneOn, "language:", !!language);
      stopListening();
    }

    return () => {
      // Cleanup on unmount only
    };
  }, [isMicrophoneOn, language, startListening, stopListening]);

  // Auto-speak answer parts when entering RESULT stage (if headphones are on)
  useEffect(() => {
    if (stage === "RESULT" && isHeadphonesOn) {
      console.log("Auto-triggering speech (RESULT stage loaded)");
      speakAnswerParts();
    }
  }, [stage, isHeadphonesOn, speakAnswerParts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: Event) => {
      const keyEvent = e as unknown as globalThis.KeyboardEvent;
      if (keyEvent.ctrlKey && keyEvent.key === ";") {
        keyEvent.preventDefault();
        if (stage === "RESULT" && speakerButtonRef.current) {
          console.log("Volume button triggered by Ctrl+;");
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
      boxParts = shuffledBoxParts;
      boxDisplayType = 'word-with-basic';
      inputAnswerValue = true;
    } else if (mode === "DICTIONARY" && mechanism === "TABLE" && method === "AnswerToQuestion") {
      // A, D, G
      // AnswerToQuestion: Input questions (answer: false), so box shows questions
      showBox = true;
      boxParts = shuffledBoxParts;
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
      boxParts = shuffledBoxParts;
      boxDisplayType = 'basic-only';
      inputAnswerValue = true;
    } else if (mode === "EXERCISE" && mechanism === "TABLE" && method === "AnswerToQuestion") {
      // A, E, G
      // AnswerToQuestion: Input questions (answer: false), so box shows questions (basicWord only)
      showBox = true;
      boxParts = shuffledBoxParts;
      boxDisplayType = 'basic-only';
      inputAnswerValue = false;
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
            <div className="flex gap-4 items-center">
              <Button
                ref={microphoneButtonRef}
                variant="outline" 
                size="icon"
                onClick={() => {
                  setIsMicrophoneOn(!isMicrophoneOn);
                  console.log("Microphone toggled");
                }}
                className={`${!isMicrophoneOn ? "opacity-50" : ""} ${isListening ? "ring-2 ring-red-500 animate-pulse" : ""} relative`}
              >
                <Mic className="h-5 w-5" />
                {!isMicrophoneOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-foreground rotate-45 transform scale-x-75"></div>
                  </div>
                )}
              </Button>
              {isListening && (
                <span className="text-sm text-red-500 animate-pulse">Listening...</span>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsHeadphonesOn(!isHeadphonesOn);
                  console.log("Volume toggled");
                }}
                className={!isHeadphonesOn ? "opacity-50 relative" : ""}
              >
                <Volume2 className="h-5 w-5" />
                {!isHeadphonesOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-foreground rotate-45 transform scale-x-75"></div>
                  </div>
                )}
              </Button>
            </div>
          )}

          {stage === "RESULT" && (
            <div className="flex gap-4">
              <Button
                ref={microphoneButtonRef}
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsMicrophoneOn(!isMicrophoneOn);
                  console.log("Microphone toggled");
                }}
                className={!isMicrophoneOn ? "opacity-50 relative" : ""}
              >
                <Mic className="h-5 w-5" />
                {!isMicrophoneOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-foreground rotate-45 transform scale-x-75"></div>
                  </div>
                )}
              </Button>
              <Button
                ref={speakerButtonRef}
                variant="outline" 
                size="icon"
                onClick={() => {
                  setIsHeadphonesOn(!isHeadphonesOn);
                  console.log("Volume toggled");
                  // If turning on, also play the speech
                  if (!isHeadphonesOn) {
                    setTimeout(() => speakAnswerParts(), 100);
                  }
                }}
                className={!isHeadphonesOn ? "opacity-50 relative" : ""}
              >
                <Volume2 className="h-5 w-5" />
                {!isHeadphonesOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-foreground rotate-45 transform scale-x-75"></div>
                  </div>
                )}
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
                  <Button ref={checkButtonRef} onClick={handleCheck} size="lg">
                    {stage === "ANSWER" ? "Check" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Interim speech recognition display */}
          {interimTranscript && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span className="text-sm">{interimTranscript}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
