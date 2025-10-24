import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Category, CategoryMethod } from "@/types/category";

interface StartRepeatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onStart: (data: {
    categoryIds: number[];
    includeChosen: boolean;
    wordCount: number;
    method: CategoryMethod;
  }) => void;
}

export default function StartRepeatingModal({
  open,
  onOpenChange,
  categories,
  onStart,
}: StartRepeatingModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [includeChosen, setIncludeChosen] = useState(false);
  const [wordCount, setWordCount] = useState(10);
  const [method, setMethod] = useState<CategoryMethod>("Both");
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    // Reset state when modal opens
    if (open) {
      setSelectedCategories([]);
      setIncludeChosen(false);
      setWordCount(10);
      setMethod("Both");
      setFilterText("");
    }
  }, [open]);

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  const handleSubmit = async () => {
    await onStart({
      categoryIds: selectedCategories,
      includeChosen,
      wordCount,
      method,
    });
    onOpenChange(false);
  };

  const getVisibleCategories = () => {
    if (!filterText.trim()) {
      return categories;
    }

    const searchTerm = filterText.toLowerCase();
    const visibleIds = new Set<number>();
    
    // Find matching categories
    categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(searchTerm)) {
        visibleIds.add(cat.id);
        
        // Add all parents
        let parent = categories.find(c => c.id === cat.id_parent);
        while (parent) {
          visibleIds.add(parent.id);
          parent = categories.find(c => c.id === parent?.id_parent);
        }
      }
    });
    
    return categories.filter(cat => visibleIds.has(cat.id));
  };

  const visibleCategories = getVisibleCategories();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start Repeating</DialogTitle>
          <DialogDescription>
            Configure your repeating session
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Categories</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedCategories.length === categories.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground border rounded-lg p-3 bg-muted/50">
              {selectedCategories.length > 0 
                ? categories
                    .filter(c => selectedCategories.includes(c.id))
                    .map(c => c.name)
                    .join(", ")
                : "No categories selected"}
            </div>
            <Input
              placeholder="Filter categories..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-9"
            />
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {visibleCategories
                .sort((a, b) => a.order - b.order)
                .map(category => {
                  const indentLevel = category.id_parent ? 1 : 0;
                  return (
                    <div 
                      key={category.id} 
                      className="flex items-center space-x-2"
                      style={{ paddingLeft: `${indentLevel * 24}px` }}
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {category.name}
                      </label>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-chosen"
              checked={includeChosen}
              onCheckedChange={(checked) => setIncludeChosen(checked as boolean)}
            />
            <label
              htmlFor="include-chosen"
              className="text-sm cursor-pointer"
            >
              Include chosen
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="word-count">Number of Words</Label>
            <Input
              id="word-count"
              type="number"
              min="1"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Method</Label>
            <Select value={method} onValueChange={(value: CategoryMethod) => setMethod(value)}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Both">Both</SelectItem>
                <SelectItem value="QuestionToAnswer">QuestionToAnswer</SelectItem>
                <SelectItem value="AnswerToQuestion">AnswerToQuestion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={selectedCategories.length === 0}
            className="w-full"
          >
            Start repeating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
