import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, GripVertical } from "lucide-react";
import { Word, WordPart } from "@/types/word";
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
}: {
  part: WordPartInput;
  index: number;
  onUpdate: (id: string, field: keyof WordPartInput, value: any) => void;
  onDelete: (id: string) => void;
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
          placeholder={part.answer ? "Answer word" : "Question word"}
          value={part.word}
          onChange={(e) => onUpdate(part.id, "word", e.target.value)}
        />
        <Input
          placeholder="Basic word (optional)"
          value={part.basicWord}
          onChange={(e) => onUpdate(part.id, "basicWord", e.target.value)}
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

export default function AddWordForm({ categoryId, onWordAdded }: AddWordFormProps) {
  const [comment, setComment] = useState("");
  const [wordParts, setWordParts] = useState<WordPartInput[]>([
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    if (!comment.trim()) {
      toast.error("Comment is required");
      return;
    }

    if (wordParts.some((part) => !part.word.trim())) {
      toast.error("All word parts must have a word value");
      return;
    }

    // Create the word object
    const newWord: Word = {
      id: Date.now(),
      accepted: false,
      comment: comment.trim(),
      resetTimestamp: null,
      mechanism: "BASIC",
      chosen: false,
      toRepeat: false,
      repeated: 0,
      lastTimestampRepeated: null,
      created: Date.now(),
      wordParts: wordParts.map((part, index) => ({
        answer: part.answer,
        basicWord: part.basicWord.trim(),
        position: index,
        toSpeech: part.toSpeech,
        word: part.word.trim(),
      })),
      wordStats: [],
    };

    onWordAdded(newWord);

    // Reset form
    setComment("");
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

    toast.success("Word added successfully");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-6 bg-card">
      <h3 className="text-lg font-semibold">Add New Word</h3>

      <div>
        <label className="text-sm font-medium mb-2 block">Comment</label>
        <Input
          placeholder="Enter comment for this word..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
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
        Add Word
      </Button>
    </form>
  );
}
