import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Category } from "@/types/category";

interface ManageCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  initialCategories: string[];
  onSave: (categoryNames: string[]) => void;
}

export default function ManageCategoriesModal({
  open,
  onOpenChange,
  categories,
  initialCategories,
  onSave,
}: ManageCategoriesModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedCategories(initialCategories);
      setFilterText("");
    }
  }, [open, initialCategories]);

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleSubmit = () => {
    onSave(selectedCategories);
    onOpenChange(false);
  };

  const selectedCategoriesText = selectedCategories.length > 0 
    ? selectedCategories.join(", ") 
    : "No categories selected";

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
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Select or deselect categories for this word
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected Categories:</div>
            <div className="text-sm text-muted-foreground border rounded-lg p-3 bg-muted/50">
              {selectedCategoriesText}
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
                        checked={selectedCategories.includes(category.name)}
                        onCheckedChange={() => handleCategoryToggle(category.name)}
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

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              Save
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
