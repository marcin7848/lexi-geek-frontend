import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Category } from "@/types/category";
import { Word } from "@/types/word";
import { mockWordsByCategory } from "@/data/mockWords";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    // Find category from all languages
    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    let foundCategory: Category | null = null;

    for (const language of languages) {
      const storageKey = `categories_${language.id}`;
      const storedCategories = localStorage.getItem(storageKey);
      
      if (storedCategories) {
        const categories: Category[] = JSON.parse(storedCategories);
        const found = categories.find((cat) => cat.id === Number(categoryId));
        
        if (found) {
          foundCategory = found;
          break;
        }
      }
    }

    if (foundCategory) {
      setCategory(foundCategory);
      
      // Load words from localStorage or initialize with mock data
      const storageKey = `words_${categoryId}`;
      const storedWords = localStorage.getItem(storageKey);
      
      if (storedWords) {
        setWords(JSON.parse(storedWords));
      } else {
        // Initialize with mock data for this category
        const categoryWords = mockWordsByCategory[Number(categoryId)] || [];
        setWords(categoryWords);
        localStorage.setItem(storageKey, JSON.stringify(categoryWords));
      }
    } else {
      toast.error("Category not found");
      navigate(-1);
    }
  }, [categoryId, navigate]);

  const handleChosenChange = (wordId: number, checked: boolean) => {
    const updatedWords = words.map((word) =>
      word.id === wordId ? { ...word, chosen: checked } : word
    );
    setWords(updatedWords);
    
    // Persist to localStorage
    const storageKey = `words_${categoryId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedWords));
  };

  const renderWordParts = (wordParts: Word["wordParts"]) => {
    const sortedParts = [...wordParts].sort((a, b) => a.position - b.position);
    
    return (
      <div className="flex flex-wrap gap-1 items-center">
        {sortedParts.map((part, index) => (
          <span key={index}>
            <span
              className={
                part.answer
                  ? "bg-primary/20 px-1 py-0.5 rounded"
                  : ""
              }
            >
              {part.word}
            </span>
            {part.basicWord && (
              <span className="text-muted-foreground text-sm ml-1">
                ({part.basicWord})
              </span>
            )}
          </span>
        ))}
      </div>
    );
  };

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="py-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            <div className="flex gap-4 mt-2 text-muted-foreground">
              <span>Mode: <Badge variant="outline">{category.mode}</Badge></span>
              <span>Method: <Badge variant="outline">{category.method}</Badge></span>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Word</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Mechanism</TableHead>
                  <TableHead>Chosen</TableHead>
                  <TableHead>Repeated</TableHead>
                  <TableHead>Last Repeated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.map((word) => (
                  <TableRow key={word.id}>
                    <TableCell>{renderWordParts(word.wordParts)}</TableCell>
                    <TableCell>{word.comment}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{word.mechanism}</Badge>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={word.chosen}
                        onCheckedChange={(checked) =>
                          handleChosenChange(word.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>{word.repeated}</TableCell>
                    <TableCell>
                      {word.lastTimestampRepeated
                        ? format(new Date(word.lastTimestampRepeated), "PPp")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
