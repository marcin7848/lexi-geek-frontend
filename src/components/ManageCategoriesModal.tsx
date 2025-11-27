import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Category } from "@/types/category";
import { categoryService } from "@/services/categoryService";

interface ManageCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languageUuid: string;
  initialCategoryNames: string[];
  onSave: (categoryUuids: string[]) => void;
}

export default function ManageCategoriesModal({
  open,
  onOpenChange,
  languageUuid,
  initialCategoryNames,
  onSave,
}: ManageCategoriesModalProps) {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [displayedCategories, setDisplayedCategories] = useState<Category[]>([]);
  const [selectedCategoryUuids, setSelectedCategoryUuids] = useState<string[]>([]);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize getFilteredCategories
  const getFilteredCategories = useCallback(() => {
    if (!filterText.trim()) {
      return allCategories;
    }

    const searchTerm = filterText.toLowerCase();
    return allCategories.filter(cat =>
      cat.name.toLowerCase().includes(searchTerm)
    );
  }, [allCategories, filterText]);

  // Memoize loadCategories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const categories = await categoryService.getAll(languageUuid);
      setAllCategories(categories);
      setDisplayCount(20); // Reset display count
      setFilterText(""); // Reset filter
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  }, [languageUuid]);

  // Fetch all categories when modal opens
  useEffect(() => {
    if (open && languageUuid) {
      loadCategories();
    }
  }, [open, languageUuid, loadCategories]);

  // Initialize selected categories based on names
  useEffect(() => {
    if (open && allCategories.length > 0) {
      const selectedUuids = allCategories
        .filter(cat => initialCategoryNames.includes(cat.name))
        .map(cat => cat.uuid);
      setSelectedCategoryUuids(selectedUuids);
    }
  }, [open, allCategories, initialCategoryNames]);

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

  const handleSubmit = () => {
    if (selectedCategoryUuids.length === 0) {
      // API requires at least one category
      alert("Please select at least one category");
      return;
    }
    onSave(selectedCategoryUuids);
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
    return allCategories
      .filter(cat => selectedCategoryUuids.includes(cat.uuid))
      .map(cat => cat.name);
  };

  const selectedCategoriesText = selectedCategoryUuids.length > 0
    ? getSelectedCategoryNames().join(", ")
    : "No categories selected";

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
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Select categories for this word (at least one required)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected Categories:</div>
            <div className="text-sm text-muted-foreground border rounded-lg p-3 bg-muted/50 max-h-20 overflow-y-auto">
              {selectedCategoriesText}
            </div>
          </div>

          <div className="space-y-2">
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
              {loading ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Loading categories...
                </div>
              ) : displayedCategories.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No categories found
                </div>
              ) : (
                <>
                  {buildCategoryTree()}
                  {displayCount < getFilteredCategories().length && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      Scroll down for more...
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Showing {displayedCategories.length} of {getFilteredCategories().length} categories
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1" disabled={selectedCategoryUuids.length === 0}>
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
