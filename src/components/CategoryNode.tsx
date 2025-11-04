import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Category } from "@/types/category";
import { ChevronDown, ChevronRight, Book, Dumbbell, ArrowRight, ArrowLeft, ArrowLeftRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CategoryEditForm } from "./CategoryEditForm";
import { DropZone } from "@/components/dnd/DropZone";

type CategoryNodeProps = {
  category: Category;
  categories: Category[];
  isExpanded: boolean;
  expandedIds?: Set<string>;
  onToggleExpand: (uuid: string) => void;
  onEdit: (uuid: string, name: string, mode: Category["mode"], method: Category["method"]) => void;
  onDelete: (uuid: string) => void;
  depth?: number;
  isOver?: boolean;
  isDragging?: boolean;
};

export const CategoryNode = ({
  category,
  categories,
  isExpanded,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
  depth = 0,
  isOver = false,
  isDragging = false,
}: CategoryNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging, setActivatorNodeRef } = useSortable({
    id: category.uuid,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  };

  const children = categories
    .filter(cat => cat.parentUuid === category.uuid)
    .sort((a, b) => a.position - b.position);

  const hasChildren = children.length > 0;

  const getModeIcon = () => {
    return category.mode === "DICTIONARY" ? (
      <span title="Dictionary">
        <Book className="h-4 w-4 text-primary" />
      </span>
    ) : (
      <span title="Exercise">
        <Dumbbell className="h-4 w-4 fill-orange-500 text-orange-500" />
      </span>
    );
  };

  const getMethodIcon = () => {
    switch (category.method) {
      case "QUESTION_TO_ANSWER":
        return <span title="Question to Answer"><ArrowRight className="h-4 w-4 text-muted-foreground" /></span>;
      case "ANSWER_TO_QUESTION":
        return <span title="Answer to Question"><ArrowLeft className="h-4 w-4 text-muted-foreground" /></span>;
      case "BOTH":
        return <span title="Both"><ArrowLeftRight className="h-4 w-4 text-muted-foreground" /></span>;
    }
  };

  const handleCategoryClick = () => {
    if (clickTimeout) {
      // Double click - open edit
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      setIsEditing(true);
    } else {
      // Single click - navigate to category page
      const timeout = setTimeout(() => {
        setClickTimeout(null);
        navigate(`/category/${category.uuid}`);
      }, 250);
      setClickTimeout(timeout);
    }
  };

  const handleSave = (name: string, mode: Category["mode"], method: Category["method"]) => {
    onEdit(category.uuid, name, mode, method);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isOver && !isSortableDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/5 rounded-md pointer-events-none z-10" />
      )}
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent group transition-colors",
          isSortableDragging && "opacity-30"
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        <div 
          ref={setActivatorNodeRef}
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(category.uuid);
            }}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-4" />}

        {!isEditing ? (
          <>
            <span
              onClick={handleCategoryClick}
              className="flex-1 cursor-pointer select-none"
            >
              {category.name}
            </span>
            <div className="flex items-center gap-2">
              {getModeIcon()}
              {getMethodIcon()}
            </div>
          </>
        ) : (
          <CategoryEditForm
            category={category}
            onSave={handleSave}
            onDelete={() => onDelete(category.uuid)}
            onCancel={() => setIsEditing(false)}
          />
        )}
      </div>

      {isExpanded && (
        <SortableContext items={children.map(c => c.uuid)} strategy={verticalListSortingStrategy}>
          <div>
            {children.map(child => {
              const childIsOver = isOver && !isSortableDragging;
              return (
                <CategoryNode
                  key={child.uuid}
                  category={child}
                  categories={categories}
                  isExpanded={expandedIds ? expandedIds.has(child.uuid) : true}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                  isOver={childIsOver}
                />
              );
            })}
            <DropZone id={`dropzone-parent-${category.uuid}`} />
          </div>
        </SortableContext>
      )}
    </div>
  );
};
