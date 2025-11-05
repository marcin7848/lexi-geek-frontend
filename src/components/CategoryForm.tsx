import { useState } from "react";
import { Category, CategoryMode, CategoryMethod } from "@/types/category";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";

type CategoryFormProps = {
  categories: Category[];
  onSubmit: (name: string, mode: CategoryMode, method: CategoryMethod, parentUuid: string | null) => void;
  onCancel: () => void;
};

export const CategoryForm = ({ categories, onSubmit, onCancel }: CategoryFormProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<CategoryMode>("DICTIONARY");
  const [method, setMethod] = useState<CategoryMethod>("BOTH");
  const [parentUuid, setParentUuid] = useState<string>("none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parentUuidValue = parentUuid === "none" ? null : parentUuid;
    onSubmit(name, mode, method, parentUuidValue);

    // Reset form
    if (name.trim()) {
      setName("");
      setMode("DICTIONARY");
      setMethod("BOTH");
      setParentUuid("none");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="parent">{t("categoryForm.parentCategory")}</Label>
        <Select value={parentUuid} onValueChange={setParentUuid}>
          <SelectTrigger id="parent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("categoryForm.parentNone")}</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.uuid} value={cat.uuid}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("categoryForm.name")}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("categoryForm.namePlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode">{t("categoryForm.mode")}</Label>
        <Select value={mode} onValueChange={(v) => setMode(v as CategoryMode)}>
          <SelectTrigger id="mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DICTIONARY">{t("categoryForm.modeDictionary")}</SelectItem>
            <SelectItem value="EXERCISE">{t("categoryForm.modeExercise")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">{t("categoryForm.method")}</Label>
        <Select value={method} onValueChange={(v) => setMethod(v as CategoryMethod)}>
          <SelectTrigger id="method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="QUESTION_TO_ANSWER">{t("categoryForm.methodQuestionToAnswer")}</SelectItem>
            <SelectItem value="ANSWER_TO_QUESTION">{t("categoryForm.methodAnswerToQuestion")}</SelectItem>
            <SelectItem value="BOTH">{t("categoryForm.methodBoth")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit">{t("categoryForm.addButton")}</Button>
      </div>
    </form>
  );
};
