import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";

type DropZoneProps = {
  id: string;
  depth?: number;
};

export const DropZone = ({ id, depth = 0 }: DropZoneProps) => {
  const { t } = useLanguage();
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all relative rounded-md",
        isOver
          ? "h-10 bg-primary/20 border-2 border-dashed border-primary my-1"
          : "h-2"
      )}
      style={{ marginLeft: `${depth * 24 + 12}px`, marginRight: "12px" }}
      aria-label={t("dropZone.dropHere")}
    >
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-primary font-medium">
          {t("dropZone.dropHere")}
        </div>
      )}
    </div>
  );
};