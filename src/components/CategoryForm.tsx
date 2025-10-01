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
  onSubmit: (name: string, mode: CategoryMode, method: CategoryMethod, parentId: number | null) => void;
  onCancel: () => void;
};

export const CategoryForm = ({ categories, onSubmit, onCancel }: CategoryFormProps) => {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<CategoryMode>("Dictionary");
  const [method, setMethod] = useState<CategoryMethod>("BothSides");
  const [parentId, setParentId] = useState<string>("none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(
        name.trim(),
        mode,
        method,
        parentId === "none" ? null : Number(parentId)
      );
      setName("");
      setMode("Dictionary");
      setMethod("BothSides");
      setParentId("none");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="parent">Parent Category</Label>
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger id="parent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Root Category)</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
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
            <SelectItem value="Dictionary">Dictionary</SelectItem>
            <SelectItem value="Exercise">Exercise</SelectItem>
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
            <SelectItem value="FirstToSecond">First → Second</SelectItem>
            <SelectItem value="SecondToFirst">Second → First</SelectItem>
            <SelectItem value="BothSides">Both Sides</SelectItem>
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
