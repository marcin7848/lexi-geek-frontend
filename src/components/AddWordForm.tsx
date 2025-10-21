import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, GripVertical } from "lucide-react";
import { Word, Mechanism } from "@/types/word";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface AddWordFormProps {
  categoryId: string;
  onWordAdded: (word: Word) => void;
  editWord?: Word | null;
  onClose?: () => void;
  specialLetters?: string;
}

interface WordPartInput {
  id: string;
  word: string;
  basicWord: string;
  answer: boolean;
  toSpeech: boolean;
}

function SortableWordPartRow({
  part,
  index,
  onUpdate,
  onDelete,
  firstInputRef,
}: {
  part: WordPartInput;
  index: number;
  onUpdate: (id: string, field: keyof WordPartInput, value: any) => void;
  onDelete: (id: string) => void;
  firstInputRef?: React.RefObject<HTMLInputElement>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: part.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-lg border ${
        part.answer ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-muted"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input
          id={`word-${part.id}-word`}
          ref={index === 0 && !part.answer ? firstInputRef : undefined}
          placeholder={part.answer ? "Answer word" : "Question word"}
          value={part.word}
          onChange={(e) => onUpdate(part.id, "word", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const nextInput = document.getElementById(`word-${part.id}-basicWord`);
              nextInput?.focus();
            }
          }}
        />
        <Input
          id={`word-${part.id}-basicWord`}
          placeholder="Basic word (optional)"
          value={part.basicWord}
          onChange={(e) => onUpdate(part.id, "basicWord", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              // Focus next word part's word input
              const allParts = document.querySelectorAll('[id^="word-"][id$="-word"]');
              const currentIndex = Array.from(allParts).findIndex(
                (el) => el.id === `word-${part.id}-word`
              );
              if (currentIndex < allParts.length - 1) {
                (allParts[currentIndex + 1] as HTMLInputElement).focus();
              } else {
                // Cycle back to first input
                (allParts[0] as HTMLInputElement).focus();
              }
            }
          }}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id={`toSpeech-${part.id}`}
            checked={part.toSpeech}
            onCheckedChange={(checked) => onUpdate(part.id, "toSpeech", checked)}
          />
          <label
            htmlFor={`toSpeech-${part.id}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            To Speech
          </label>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(part.id)}
        className="text-destructive hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function AddWordForm({ categoryId, onWordAdded, editWord, onClose, specialLetters }: AddWordFormProps) {
  const [comment, setComment] = useState(editWord?.comment || "");
  const [mechanism, setMechanism] = useState<Mechanism>(editWord?.mechanism || "BASIC");
  const [wordParts, setWordParts] = useState<WordPartInput[]>(
    editWord
      ? editWord.wordParts.map((part) => ({
          id: crypto.randomUUID(),
          word: part.word,
          basicWord: part.basicWord,
          answer: part.answer,
          toSpeech: part.toSpeech,
        }))
      : [
          {
            id: crypto.randomUUID(),
            word: "",
            basicWord: "",
            answer: false,
            toSpeech: false,
          },
          {
            id: crypto.randomUUID(),
            word: "",
            basicWord: "",
            answer: true,
            toSpeech: true,
          },
        ]
  );
  const firstInputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Focus first input when modal opens
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ";") {
        e.preventDefault();
        addWordPart(false);
      } else if (e.ctrlKey && e.key === "'") {
        e.preventDefault();
        addWordPart(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const insertSpecialLetter = (letter: string) => {
    const activeElement = document.activeElement as HTMLInputElement;
    if (activeElement && activeElement.tagName === "INPUT") {
      const start = activeElement.selectionStart || 0;
      const end = activeElement.selectionEnd || 0;
      const currentValue = activeElement.value;
      const newValue = currentValue.slice(0, start) + letter + currentValue.slice(end);
      
      // Find which word part this input belongs to
      const inputId = activeElement.id;
      if (inputId.startsWith("comment")) {
        setComment(newValue);
        activeElement.focus();
        setTimeout(() => {
          activeElement.setSelectionRange(start + 1, start + 1);
        }, 0);
      } else {
        const [, partId, field] = inputId.split("-");
        setWordParts((parts) =>
          parts.map((part) =>
            part.id === partId ? { ...part, [field]: newValue } : part
          )
        );
        activeElement.focus();
        setTimeout(() => {
          activeElement.setSelectionRange(start + 1, start + 1);
        }, 0);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWordParts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateWordPart = (id: string, field: keyof WordPartInput, value: any) => {
    setWordParts((parts) =>
      parts.map((part) =>
        part.id === id ? { ...part, [field]: value } : part
      )
    );
  };

  const deleteWordPart = (id: string) => {
    if (wordParts.length <= 1) {
      toast.error("You must have at least one word part");
      return;
    }
    setWordParts((parts) => parts.filter((part) => part.id !== id));
  };

  const addWordPart = (answer: boolean) => {
    const newPart: WordPartInput = {
      id: crypto.randomUUID(),
      word: "",
      basicWord: "",
      answer,
      toSpeech: answer,
    };
    setWordParts((parts) => [...parts, newPart]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (wordParts.some((part) => !part.word.trim())) {
      toast.error("All word parts must have a word value");
      return;
    }

    // Create or update the word object
    const wordData: Word = {
      id: editWord?.id || Date.now(),
      accepted: editWord?.accepted ?? false,
      comment: comment.trim(),
      resetTimestamp: editWord?.resetTimestamp || null,
      mechanism,
      chosen: editWord?.chosen || false,
      toRepeat: editWord?.toRepeat || false,
      repeated: editWord?.repeated || 0,
      lastTimestampRepeated: editWord?.lastTimestampRepeated || null,
      created: editWord?.created || Date.now(),
      wordParts: wordParts.map((part, index) => ({
        answer: part.answer,
        basicWord: part.basicWord.trim(),
        position: index,
        toSpeech: part.toSpeech,
        word: part.word.trim(),
      })),
      wordStats: editWord?.wordStats || [],
    };

    onWordAdded(wordData);

    if (editWord) {
      // Close modal after editing
      onClose?.();
      toast.success("Word updated successfully");
    } else {
      // Reset form for adding new words
      setComment("");
      setMechanism("BASIC");
      setWordParts([
        {
          id: crypto.randomUUID(),
          word: "",
          basicWord: "",
          answer: false,
          toSpeech: false,
        },
        {
          id: crypto.randomUUID(),
          word: "",
          basicWord: "",
          answer: true,
          toSpeech: true,
        },
      ]);
      firstInputRef.current?.focus();
      toast.success("Word added successfully");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">{editWord ? "Edit Word" : "Add New Word"}</h3>

      {/* Keyboard shortcuts info */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
        <strong>Shortcuts:</strong> Ctrl+; (add question part), Ctrl+' (add answer part), Enter (submit)
      </div>

      {/* Special Letters */}
      {specialLetters && specialLetters.length > 0 && (
        <div className="border rounded-lg p-3">
          <label className="text-sm font-medium block mb-2">Special Letters</label>
          <div className="flex flex-wrap gap-2">
            {specialLetters.split(",").map((letter, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertSpecialLetter(letter)}
                className="h-8 w-8 p-0"
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">Comment</label>
        <Input
          id="comment-input"
          placeholder="Enter comment for this word..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Mechanism</label>
        <Select value={mechanism} onValueChange={(value: Mechanism) => setMechanism(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BASIC">Basic</SelectItem>
            <SelectItem value="TABLE">Table</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium block">Word Parts</label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={wordParts.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {wordParts.map((part, index) => (
              <SortableWordPartRow
                key={part.id}
                part={part}
                index={index}
                onUpdate={updateWordPart}
                onDelete={deleteWordPart}
                firstInputRef={index === 0 && !part.answer ? firstInputRef : undefined}
              />
            ))}
          </SortableContext>
        </DndContext>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => addWordPart(false)}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question Part
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addWordPart(true)}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Answer Part
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {editWord ? "Update Word" : "Add Word"}
      </Button>
    </form>
  );
}
