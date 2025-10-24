import { useState } from "react";
import { Category, CategoryMode, CategoryMethod } from "@/types/category";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Trash2 } from "lucide-react";

type CategoryEditFormProps = {
  category: Category;
  onSave: (name: string, mode: CategoryMode, method: CategoryMethod) => void;
  onDelete: () => void;
  onCancel: () => void;
};

export const CategoryEditForm = ({
  category,
  onSave,
  onDelete,
  onCancel,
}: CategoryEditFormProps) => {
  const [name, setName] = useState(category.name);
  const [mode, setMode] = useState<CategoryMode>(category.mode);
  const [method, setMethod] = useState<CategoryMethod>(category.method);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), mode, method);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8"
        autoFocus
      />
      
      <Select value={mode} onValueChange={(v) => setMode(v as CategoryMode)}>
        <SelectTrigger className="h-8 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Dictionary">Dictionary</SelectItem>
          <SelectItem value="Exercise">Exercise</SelectItem>
        </SelectContent>
      </Select>

      <Select value={method} onValueChange={(v) => setMethod(v as CategoryMethod)}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="QuestionToAnswer">Question → Answer</SelectItem>
          <SelectItem value="AnswerToQuestion">Answer → Question</SelectItem>
          <SelectItem value="Both">Both</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-8">
          Save
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8" onClick={onCancel}>
          Cancel
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" size="sm" variant="destructive" className="h-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{category.name}" and all its subcategories. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </form>
  );
};
