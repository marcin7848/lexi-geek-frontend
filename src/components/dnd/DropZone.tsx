import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

type DropZoneProps = {
  id: string;
};

export const DropZone = ({ id }: DropZoneProps) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-3 rounded-md transition-colors",
        isOver ? "bg-primary/30" : "bg-transparent"
      )}
      aria-label="Drop here"
    />
  );
};