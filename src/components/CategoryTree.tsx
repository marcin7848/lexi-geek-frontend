import { useState } from "react";
import { Category, CategoryMode, CategoryMethod } from "@/types/category";
import { CategoryNode } from "./CategoryNode";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { CategoryForm } from "./CategoryForm";
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, closestCenter, pointerWithin } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

type CategoryTreeProps = {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
};

export const CategoryTree = ({ categories, onUpdate }: CategoryTreeProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(
    new Set(categories.map(c => c.id))
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  const buildTree = (parentId: number | null = null): Category[] => {
    return categories
      .filter(cat => cat.id_parent === parentId)
      .sort((a, b) => a.order - b.order);
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleEdit = (id: number, updates: Partial<Category>) => {
    const updated = categories.map(cat =>
      cat.id === id ? { ...cat, ...updates } : cat
    );
    onUpdate(updated);
  };

  const handleDelete = (id: number) => {
    const deleteRecursive = (catId: number): number[] => {
      const children = categories.filter(c => c.id_parent === catId);
      return [catId, ...children.flatMap(c => deleteRecursive(c.id))];
    };
    
    const idsToDelete = deleteRecursive(id);
    const updated = categories.filter(cat => !idsToDelete.includes(cat.id));
    onUpdate(updated);
  };

  const handleAdd = (name: string, mode: CategoryMode, method: CategoryMethod, parentId: number | null) => {
    const maxId = Math.max(...categories.map(c => c.id), 0);
    const siblings = categories.filter(c => c.id_parent === parentId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(c => c.order)) : 0;
    
    const newCategory: Category = {
      id: maxId + 1,
      id_parent: parentId,
      name,
      mode,
      method,
      order: maxOrder + 1,
    };
    
    onUpdate([...categories, newCategory]);
    setIsAddDialogOpen(false);
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? Number(over.id) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);
    
    if (!over || active.id === over.id) return;

    const draggedId = Number(active.id);
    const targetId = Number(over.id);
    
    const draggedCategory = categories.find(c => c.id === draggedId);
    const targetCategory = categories.find(c => c.id === targetId);
    
    if (!draggedCategory || !targetCategory) return;

    // Prevent dropping a parent into its own child
    const isDescendant = (parentId: number, childId: number): boolean => {
      const children = categories.filter(c => c.id_parent === parentId);
      if (children.some(c => c.id === childId)) return true;
      return children.some(c => isDescendant(c.id, childId));
    };

    if (isDescendant(draggedId, targetId)) return;

    // If dropping on same parent, reorder
    if (draggedCategory.id_parent === targetCategory.id_parent) {
      const siblings = categories.filter(c => c.id_parent === draggedCategory.id_parent && c.id !== draggedId);
      const overIndex = siblings.findIndex(c => c.id === targetId);
      
      const reordered = siblings
        .slice(0, overIndex + 1)
        .concat(draggedCategory)
        .concat(siblings.slice(overIndex + 1))
        .map((cat, idx) => ({ ...cat, order: idx + 1 }));
      
      const updated = categories.map(cat => {
        const reorderedCat = reordered.find(r => r.id === cat.id);
        return reorderedCat || cat;
      });
      
      onUpdate(updated);
    } else {
      // Change parent - make it a child of the target
      const newSiblings = categories.filter(c => c.id_parent === targetId);
      const maxOrder = newSiblings.length > 0 ? Math.max(...newSiblings.map(c => c.order)) : 0;
      
      const updated = categories.map(cat =>
        cat.id === draggedId
          ? { ...cat, id_parent: targetId, order: maxOrder + 1 }
          : cat
      );
      
      onUpdate(updated);
      // Auto-expand the target category to show the new child
      setExpandedIds(prev => new Set([...prev, targetId]));
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
        <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {rootCategories.map(category => (
              <CategoryNode
                key={category.id}
                category={category}
                categories={categories}
                isExpanded={expandedIds.has(category.id)}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isOver={overId === category.id}
                isDragging={activeId === category.id}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div className="py-2 px-3 rounded-md bg-accent border-2 border-dashed border-primary opacity-50">
              {categories.find(c => c.id === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
