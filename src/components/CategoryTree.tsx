import { useState } from "react";
import { Category, CategoryMode, CategoryMethod } from "@/types/category";
import { CategoryNode } from "./CategoryNode";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { categoryService } from "@/services/categoryService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { CategoryForm } from "./CategoryForm";
import { DndContext, DragStartEvent, DragEndEvent, DragOverEvent, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DropZone } from "./dnd/DropZone";

type CategoryTreeProps = {
  categories: Category[];
  languageId: string;
  onUpdate: () => void;
};

export const CategoryTree = ({ categories, languageId, onUpdate }: CategoryTreeProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set()
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const buildTree = (parentUuid: string | null = null): Category[] => {
    return categories
      .filter(cat => cat.parentUuid === parentUuid)
      .sort((a, b) => a.position - b.position);
  };

  const toggleExpand = (uuid: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(uuid)) {
      newExpanded.delete(uuid);
    } else {
      newExpanded.add(uuid);
    }
    setExpandedIds(newExpanded);
  };

  const handleEdit = async (uuid: string, name: string, mode: CategoryMode, method: CategoryMethod) => {
    try {
      const category = categories.find(cat => cat.uuid === uuid);
      if (!category) return;

      await categoryService.updateCategory(languageId, uuid, {
        name,
        mode,
        method,
        parentUuid: category.parentUuid,
      });

      toast.success("Category updated");
      onUpdate();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  const handleDelete = async (uuid: string) => {
    try {
      await categoryService.deleteCategory(languageId, uuid);
      toast.success("Category deleted");
      onUpdate();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleAdd = async (name: string, mode: CategoryMode, method: CategoryMethod, parentUuid: string | null) => {
    try {
      await categoryService.createCategory(languageId, {
        name,
        mode,
        method,
        parentUuid,
      });

      toast.success("Category created");
      setIsAddDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const id = String(over.id);
      // Check if it's a dropzone or a category UUID
      if (id.startsWith("dropzone-parent-")) {
        setOverId(null);
      } else {
        setOverId(id);
      }
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);
    
    if (!over || active.id === over.id) return;

    const draggedUuid = String(active.id);
    const draggedCategory = categories.find(c => c.uuid === draggedUuid);
    if (!draggedCategory) return;

    const overId = String(over.id);
    let newParentUuid: string | null = null;
    let newPosition = 0;

    // Check if dropped on a dropzone (makes it a child of parent or root)
    if (overId.startsWith("dropzone-parent-")) {
      const parentPart = overId.replace("dropzone-parent-", "");
      newParentUuid = parentPart === "null" ? null : parentPart;

      // Calculate position - place at the end of siblings
      const siblings = categories.filter(c => c.parentUuid === newParentUuid);
      newPosition = siblings.length > 0 ? Math.max(...siblings.map(s => s.position)) : 0;
    } else {
      // Dropped on another category - determine if it should be a sibling or child
      const targetCategory = categories.find(c => c.uuid === overId);
      if (!targetCategory) return;

      // Make it a sibling of the target (same parent, position after target)
      newParentUuid = targetCategory.parentUuid;
      newPosition = targetCategory.position;

      // Shift positions of categories that come after
      // Note: Backend should handle this reordering
    }

    // Prevent making a category its own descendant
    if (newParentUuid) {
      let checkParent: Category | undefined = categories.find(c => c.uuid === newParentUuid);
      while (checkParent) {
        if (checkParent.uuid === draggedUuid) {
          toast.error("Cannot move a category into its own descendant");
          return;
        }
        checkParent = categories.find(c => c.uuid === checkParent?.parentUuid);
      }
    }

    try {
      await categoryService.updateCategoryPosition(languageId, draggedUuid, {
        parentUuid: newParentUuid,
        position: newPosition,
      });

      toast.success("Category moved successfully");
      onUpdate();
    } catch (error) {
      console.error("Error moving category:", error);
      toast.error("Failed to move category");
    }
  };

  const rootCategories = buildTree(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              categories={categories}
              onSubmit={handleAdd}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DndContext 
        collisionDetection={pointerWithin} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rootCategories.map(c => c.uuid)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {rootCategories.map(category => (
              <CategoryNode
                key={category.uuid}
                category={category}
                categories={categories}
                isExpanded={expandedIds.has(category.uuid)}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isOver={overId === category.uuid}
                isDragging={activeId === category.uuid}
              />
            ))}
            <DropZone id="dropzone-parent-null" />
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div className="py-2 px-3 rounded-md bg-accent border-2 border-dashed border-primary opacity-50">
              {categories.find(c => c.uuid === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
