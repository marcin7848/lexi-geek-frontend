import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Category } from "@/types/category";
import { ChevronDown, ChevronRight, Book, Dumbbell, ArrowRight, ArrowLeft, ArrowLeftRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CategoryEditForm } from "./CategoryEditForm";
import { DropZone } from "@/components/dnd/DropZone";
import { useLanguage } from "@/i18n/LanguageProvider";

type CategoryNodeProps = {
  category: Category;
  categories: Category[];
  isExpanded: boolean;
  expandedIds?: Set<string>;
  onToggleExpand: (uuid: string) => void;
  onEdit: (uuid: string, name: string, mode: Category["mode"], method: Category["method"]) => void;
  onDelete: (uuid: string) => void;
  onReset: (uuid: string) => void;
  depth?: number;
  isLastChild?: boolean;
};

export const CategoryNode = ({
  category,
  categories,
  isExpanded,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
  onReset,
  depth = 0,
  isLastChild = false,
}: CategoryNodeProps) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging, setActivatorNodeRef } = useSortable({
    id: category.uuid,
  });

  // Make the node itself droppable to accept children
  // This needs to be on a separate container that wraps the content
  const { isOver: isOverAsParent, setNodeRef: setDroppableRef } = useDroppable({
    id: `drop-as-child-${category.uuid}`,
    disabled: isSortableDragging, // Don't allow dropping on self while dragging
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
      <span title={t("categoryNode.dictionary")}>
        <Book className="h-4 w-4 text-primary" />
      </span>
    ) : (
      <span title={t("categoryNode.exercise")}>
        <Dumbbell className="h-4 w-4 fill-orange-500 text-orange-500" />
      </span>
    );
  };

  const getMethodIcon = () => {
    switch (category.method) {
      case "QUESTION_TO_ANSWER":
        return <span title={t("categoryNode.questionToAnswer")}><ArrowRight className="h-4 w-4 text-muted-foreground" /></span>;
      case "ANSWER_TO_QUESTION":
        return <span title={t("categoryNode.answerToQuestion")}><ArrowLeft className="h-4 w-4 text-muted-foreground" /></span>;
      case "BOTH":
        return <span title={t("categoryNode.both")}><ArrowLeftRight className="h-4 w-4 text-muted-foreground" /></span>;
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
    <>
      {/* Drop zone BEFORE this node */}
      <DropZone id={`drop-before-${category.uuid}`} depth={depth} />

      {/* Sortable wrapper for drag functionality */}
      <div ref={setNodeRef} style={style} className="relative">
        {/* Droppable wrapper for making this a parent */}
        <div ref={setDroppableRef} className="relative">
          {/* Highlight when this node is a drop target for making items children */}
          {isOverAsParent && !isSortableDragging && (
            <div className="absolute inset-0 border-2 border-dashed border-green-500 bg-green-500/10 rounded-md pointer-events-none z-10">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-green-600 font-medium bg-white/90 px-2 py-1 rounded">
                {t("categoryNode.makeChild")}
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2 py-1 px-3 rounded-md hover:bg-accent group transition-colors",
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
                onReset={() => onReset(category.uuid)}
                onCancel={() => setIsEditing(false)}
              />
            )}
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <SortableContext items={children.map(c => c.uuid)} strategy={verticalListSortingStrategy}>
            <div>
              {children.map((child, index) => (
                <CategoryNode
                  key={child.uuid}
                  category={child}
                  categories={categories}
                  isExpanded={expandedIds ? expandedIds.has(child.uuid) : true}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReset={onReset}
                  depth={depth + 1}
                  isLastChild={index === children.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* Drop zone AFTER this node (only for last child) */}
      {isLastChild && <DropZone id={`drop-after-${category.uuid}`} depth={depth} />}
    </>
  );
};
