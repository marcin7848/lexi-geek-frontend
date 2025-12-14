import { useState, useEffect, useRef, useCallback } from "react";
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
    categoryUuids: string[];
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
  const [selectedCategoryUuids, setSelectedCategoryUuids] = useState<string[]>([]);
  const [displayedCategories, setDisplayedCategories] = useState<Category[]>([]);
  const [includeChosen, setIncludeChosen] = useState(false);
  const [wordCount, setWordCount] = useState(10);
  const [method, setMethod] = useState<CategoryMethod>("BOTH");
  const [filterText, setFilterText] = useState("");
  const [displayCount, setDisplayCount] = useState(20);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when modal opens
    if (open) {
      setSelectedCategoryUuids([]);
      setIncludeChosen(false);
      setWordCount(10);
      setMethod("BOTH");
      setFilterText("");
      setDisplayCount(20);
    }
  }, [open]);

  // Memoize getFilteredCategories
  const getFilteredCategories = useCallback(() => {
    if (!filterText.trim()) {
      return categories;
    }

    const searchTerm = filterText.toLowerCase();
    const matchingUuids = new Set<string>();

    // First pass: find all categories that match the filter
    categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(searchTerm)) {
        matchingUuids.add(cat.uuid);
      }
    });

    // Second pass: add all parent categories of matching categories
    matchingUuids.forEach(uuid => {
      const category = categories.find(c => c.uuid === uuid);
      if (category && category.parentUuid) {
        let parent = categories.find(c => c.uuid === category.parentUuid);
        while (parent) {
          matchingUuids.add(parent.uuid);
          parent = parent.parentUuid ? categories.find(c => c.uuid === parent?.parentUuid) : null;
        }
      }
    });

    return categories.filter(cat => matchingUuids.has(cat.uuid));
  }, [categories, filterText]);

  // Update displayed categories based on filter and display count
  useEffect(() => {
    const filtered = getFilteredCategories();
    setDisplayedCategories(filtered.slice(0, displayCount));
  }, [getFilteredCategories, displayCount]);

  const handleCategoryToggle = (categoryUuid: string) => {
    setSelectedCategoryUuids(prev =>
      prev.includes(categoryUuid)
        ? prev.filter(uuid => uuid !== categoryUuid)
        : [...prev, categoryUuid]
    );
  };

  const handleSelectAll = () => {
    const filtered = getFilteredCategories();
    if (selectedCategoryUuids.length === filtered.length) {
      setSelectedCategoryUuids([]);
    } else {
      setSelectedCategoryUuids(filtered.map(c => c.uuid));
    }
  };

  const handleSubmit = async () => {
    if (selectedCategoryUuids.length === 0) {
      alert("Please select at least one category");
      return;
    }
    await onStart({
      categoryUuids: selectedCategoryUuids,
      includeChosen,
      wordCount,
      method,
    });
    onOpenChange(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;

    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8 && displayCount < getFilteredCategories().length) {
      setDisplayCount(prev => Math.min(prev + 20, getFilteredCategories().length));
    }
  };

  const getSelectedCategoryNames = () => {
    return categories
      .filter(cat => selectedCategoryUuids.includes(cat.uuid))
      .map(cat => cat.name);
  };

  const buildCategoryTree = () => {
    // Group categories by parent
    const categoryMap = new Map<string | null, Category[]>();

    displayedCategories.forEach(cat => {
      const parentKey = cat.parentUuid || null;
      if (!categoryMap.has(parentKey)) {
        categoryMap.set(parentKey, []);
      }
      categoryMap.get(parentKey)!.push(cat);
    });

    // Sort each group by position
    categoryMap.forEach(cats => cats.sort((a, b) => a.position - b.position));

    // Render categories recursively
    const renderCategory = (category: Category, level: number): JSX.Element[] => {
      const result: JSX.Element[] = [];

      result.push(
        <div
          key={category.uuid}
          className="flex items-center space-x-2 py-1"
          style={{ paddingLeft: `${level * 24}px` }}
        >
          <Checkbox
            id={`category-${category.uuid}`}
            checked={selectedCategoryUuids.includes(category.uuid)}
            onCheckedChange={() => handleCategoryToggle(category.uuid)}
          />
          <label
            htmlFor={`category-${category.uuid}`}
            className="text-sm cursor-pointer flex-1"
          >
            {category.name}
          </label>
        </div>
      );

      // Render children
      const children = categoryMap.get(category.uuid) || [];
      children.forEach(child => {
        result.push(...renderCategory(child, level + 1));
      });

      return result;
    };

    // Start with root categories
    const rootCategories = categoryMap.get(null) || [];
    return rootCategories.flatMap(cat => renderCategory(cat, 0));
  };

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
                {selectedCategoryUuids.length === getFilteredCategories().length && getFilteredCategories().length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground border rounded-lg p-3 bg-muted/50 max-h-20 overflow-y-auto">
              {selectedCategoryUuids.length > 0
                ? getSelectedCategoryNames().join(", ")
                : "No categories selected"}
            </div>
            <Input
              placeholder="Filter categories..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setDisplayCount(20); // Reset display count on filter change
              }}
              className="h-9"
            />
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-1"
            >
              {displayedCategories.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No categories found
                </div>
              ) : (
                <>
                  {buildCategoryTree()}
                  {displayCount < getFilteredCategories().length && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      Scroll for more...
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Showing {displayedCategories.length} of {getFilteredCategories().length} categories
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
                <SelectItem value="BOTH">Both</SelectItem>
                <SelectItem value="QUESTION_TO_ANSWER">Question to Answer</SelectItem>
                <SelectItem value="ANSWER_TO_QUESTION">Answer to Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={selectedCategoryUuids.length === 0}
            className="w-full"
          >
            Start repeating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
