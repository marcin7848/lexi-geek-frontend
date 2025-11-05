import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

type DropZoneProps = {
  id: string;
  depth?: number;
};

export const DropZone = ({ id, depth = 0 }: DropZoneProps) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all relative rounded-md",
        isOver
          ? "h-10 bg-primary/20 border-2 border-dashed border-primary my-1"
          : "h-2 hover:h-4 hover:bg-accent/30"
      )}
      style={{ marginLeft: `${depth * 24 + 12}px`, marginRight: "12px" }}
      aria-label="Drop here"
    >
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-primary font-medium">
          Drop here
        </div>
      )}
    </div>
  );
};