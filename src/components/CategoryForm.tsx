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

type CategoryFormProps = {
  categories: Category[];
  onSubmit: (name: string, mode: CategoryMode, method: CategoryMethod, parentUuid: string | null) => void;
  onCancel: () => void;
};

export const CategoryForm = ({ categories, onSubmit, onCancel }: CategoryFormProps) => {
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
        <Label htmlFor="parent">Parent Category</Label>
        <Select value={parentUuid} onValueChange={setParentUuid}>
          <SelectTrigger id="parent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Root Category)</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.uuid} value={cat.uuid}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode">Mode</Label>
        <Select value={mode} onValueChange={(v) => setMode(v as CategoryMode)}>
          <SelectTrigger id="mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DICTIONARY">Dictionary</SelectItem>
            <SelectItem value="EXERCISE">Exercise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Method</Label>
        <Select value={method} onValueChange={(v) => setMethod(v as CategoryMethod)}>
          <SelectTrigger id="method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="QUESTION_TO_ANSWER">Question → Answer</SelectItem>
            <SelectItem value="ANSWER_TO_QUESTION">Answer → Question</SelectItem>
            <SelectItem value="BOTH">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Category</Button>
      </div>
    </form>
  );
};
