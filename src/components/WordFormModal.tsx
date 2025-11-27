import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddWordForm from "@/components/AddWordForm";
import { Word } from "@/types/word";
import { useLanguage } from "@/i18n/LanguageProvider";

interface WordFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  onWordAdded: (word: Word) => void;
  editWord?: Word | null;
  specialLetters?: string;
}

export default function WordFormModal({
  open,
  onOpenChange,
  categoryId,
  onWordAdded,
  editWord,
  specialLetters,
}: WordFormModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editWord ? t("wordForm.editTitle") : t("wordForm.addTitle")}</DialogTitle>
          <DialogDescription>
            {editWord ? t("wordForm.editDescription") : t("wordForm.addDescription")}
          </DialogDescription>
        </DialogHeader>
        <AddWordForm
          categoryId={categoryId}
          onWordAdded={onWordAdded}
          editWord={editWord}
          onClose={() => onOpenChange(false)}
          specialLetters={specialLetters}
        />
      </DialogContent>
    </Dialog>
  );
}
