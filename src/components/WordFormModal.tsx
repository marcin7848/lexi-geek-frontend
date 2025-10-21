import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddWordForm from "@/components/AddWordForm";
import { Word } from "@/types/word";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editWord ? "Edit Word" : "Add New Word"}</DialogTitle>
          <DialogDescription>
            {editWord ? "Update the word details below" : "Fill in the details to add a new word"}
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
