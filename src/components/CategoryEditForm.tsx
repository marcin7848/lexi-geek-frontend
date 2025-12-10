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
import { useLanguage } from "@/i18n/LanguageProvider";

type CategoryEditFormProps = {
  category: Category;
  onSave: (name: string, mode: CategoryMode, method: CategoryMethod) => void;
  onDelete: () => void;
  onReset: () => void;
  onCancel: () => void;
};

export const CategoryEditForm = ({
  category,
  onSave,
  onDelete,
  onReset,
  onCancel,
}: CategoryEditFormProps) => {
  const { t } = useLanguage();
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
          <SelectItem value="DICTIONARY">{t("categoryForm.modeDictionary")}</SelectItem>
          <SelectItem value="EXERCISE">{t("categoryForm.modeExercise")}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={method} onValueChange={(v) => setMethod(v as CategoryMethod)}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="QUESTION_TO_ANSWER">{t("categoryForm.methodQuestionToAnswer")}</SelectItem>
          <SelectItem value="ANSWER_TO_QUESTION">{t("categoryForm.methodAnswerToQuestion")}</SelectItem>
          <SelectItem value="BOTH">{t("categoryForm.methodBoth")}</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-8">
          {t("categoryEditForm.save")}
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8" onClick={onCancel}>
          {t("categoryEditForm.cancel")}
        </Button>
        <Button type="button" size="sm" variant="secondary" className="h-8" onClick={onReset}>
          {t("categoryEditForm.reset")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" size="sm" variant="destructive" className="h-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("categoryEditForm.delete")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("categoryEditForm.deleteDesc").replace("{name}", category.name)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("categoryEditForm.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>{t("common.delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </form>
  );
};
