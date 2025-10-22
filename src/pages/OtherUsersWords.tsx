import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { mockCategories } from "@/data/mockCategories";
import { Word, Mechanism } from "@/types/word";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type SortColumn = "word" | "comment" | "mechanism" | "category";
type SortDirection = "asc" | "desc";

// Mock data for other users' words with categories
interface WordWithCategory extends Word {
  categoryName: string;
}

const getMockOtherUsersWords = (): WordWithCategory[] => {
  const storageKey = "otherUsersWords";
  const stored = localStorage.getItem(storageKey);
  
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with mock data
  const mockWords: WordWithCategory[] = [
    {
      id: 10001,
      accepted: false,
      comment: "Common greeting",
      resetTimestamp: null,
      mechanism: "BASIC" as Mechanism,
      chosen: false,
      toRepeat: false,
      repeated: 0,
      lastTimestampRepeated: null,
      created: Date.now() - 86400000 * 5,
      wordParts: [
        { answer: false, basicWord: "", position: 0, toSpeech: true, word: "Buenos días" },
        { answer: true, basicWord: "", position: 1, toSpeech: false, word: "Good morning" },
      ],
      wordStats: [],
      inCategories: [],
      categoryName: "Greetings",
    },
    {
      id: 10002,
      accepted: false,
      comment: "Polite expression",
      resetTimestamp: null,
      mechanism: "BASIC" as Mechanism,
      chosen: false,
      toRepeat: false,
      repeated: 0,
      lastTimestampRepeated: null,
      created: Date.now() - 86400000 * 3,
      wordParts: [
        { answer: false, basicWord: "", position: 0, toSpeech: true, word: "Por favor" },
        { answer: true, basicWord: "", position: 1, toSpeech: false, word: "Please" },
      ],
      wordStats: [],
      inCategories: [],
      categoryName: "Courtesy",
    },
    {
      id: 10003,
      accepted: false,
      comment: "Farewell expression",
      resetTimestamp: null,
      mechanism: "TABLE" as Mechanism,
      chosen: false,
      toRepeat: false,
      repeated: 0,
      lastTimestampRepeated: null,
      created: Date.now() - 86400000 * 2,
      wordParts: [
        { answer: false, basicWord: "", position: 0, toSpeech: true, word: "Hasta luego" },
        { answer: true, basicWord: "", position: 1, toSpeech: false, word: "See you later" },
      ],
      wordStats: [],
      inCategories: [],
      categoryName: "Farewells",
    },
    {
      id: 10004,
      accepted: false,
      comment: "Question phrase",
      resetTimestamp: null,
      mechanism: "BASIC" as Mechanism,
      chosen: false,
      toRepeat: false,
      repeated: 0,
      lastTimestampRepeated: null,
      created: Date.now() - 86400000,
      wordParts: [
        { answer: false, basicWord: "", position: 0, toSpeech: true, word: "¿Cómo estás?" },
        { answer: true, basicWord: "", position: 1, toSpeech: false, word: "How are you?" },
      ],
      wordStats: [],
      inCategories: [],
      categoryName: "Questions",
    },
  ];
  
  localStorage.setItem(storageKey, JSON.stringify(mockWords));
  return mockWords;
};

const OtherUsersWords = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [otherUsersWords, setOtherUsersWords] = useState<WordWithCategory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [customPageSize, setCustomPageSize] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [textFilter, setTextFilter] = useState("");
  const [mechanismFilter, setMechanismFilter] = useState<Mechanism | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");

  const category = mockCategories.find(cat => cat.id === Number(categoryId));
  const categoryName = category?.name || "Unknown Category";

  useEffect(() => {
    setOtherUsersWords(getMockOtherUsersWords());
  }, []);

  const getWordText = (wordParts: Word["wordParts"]) => {
    const sortedParts = [...wordParts].sort((a, b) => a.position - b.position);
    return sortedParts.map((part) => part.word).join(" ");
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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedWords = () => {
    let filtered = [...otherUsersWords];

    // Apply text filter (word and comment)
    if (textFilter) {
      filtered = filtered.filter((word) => {
        const wordText = getWordText(word.wordParts).toLowerCase();
        const commentText = word.comment.toLowerCase();
        const filterText = textFilter.toLowerCase();
        return wordText.includes(filterText) || commentText.includes(filterText);
      });
    }

    // Apply mechanism filter
    if (mechanismFilter !== "ALL") {
      filtered = filtered.filter((word) => word.mechanism === mechanismFilter);
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((word) =>
        word.categoryName.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case "word":
            aValue = getWordText(a.wordParts).toLowerCase();
            bValue = getWordText(b.wordParts).toLowerCase();
            break;
          case "comment":
            aValue = a.comment.toLowerCase();
            bValue = b.comment.toLowerCase();
            break;
          case "mechanism":
            aValue = a.mechanism;
            bValue = b.mechanism;
            break;
          case "category":
            aValue = a.categoryName.toLowerCase();
            bValue = b.categoryName.toLowerCase();
            break;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const paginatedWords = () => {
    const filtered = filteredAndSortedWords();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredAndSortedWords().length / pageSize);

  const handlePageSizeChange = (value: string) => {
    if (value === "custom") {
      // Don't change pageSize yet, wait for user to input custom value
      return;
    }
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleCustomPageSize = () => {
    const size = Number(customPageSize);
    if (size > 0) {
      setPageSize(size);
      setCurrentPage(1);
      setCustomPageSize("");
    }
  };

  const handleAcceptWord = (word: WordWithCategory) => {
    // Add word to current category's pending words
    const storageKey = `words_${categoryId}`;
    const storedWords = localStorage.getItem(storageKey);
    const categoryWords: Word[] = storedWords ? JSON.parse(storedWords) : [];
    
    // Find the max ID in the category
    const maxId = categoryWords.length > 0 
      ? Math.max(...categoryWords.map(w => w.id))
      : Number(categoryId) * 1000;
    
    // Create new word with current timestamp and new ID (without categoryName)
    const { categoryName: _, ...wordWithoutCategory } = word;
    const newWord: Word = {
      ...wordWithoutCategory,
      id: maxId + 1,
      created: Date.now(),
      accepted: false,
      inCategories: [...word.inCategories, String(categoryId)],
    };
    
    const updatedCategoryWords = [...categoryWords, newWord];
    localStorage.setItem(storageKey, JSON.stringify(updatedCategoryWords));
    
    // Remove from other users words
    const updatedOtherUsersWords = otherUsersWords.filter(w => w.id !== word.id);
    setOtherUsersWords(updatedOtherUsersWords);
    localStorage.setItem("otherUsersWords", JSON.stringify(updatedOtherUsersWords));
    
    toast.success("Word added to pending words");
  };

  const handleRejectWord = (wordId: number) => {
    const updatedWords = otherUsersWords.filter(w => w.id !== wordId);
    setOtherUsersWords(updatedWords);
    localStorage.setItem("otherUsersWords", JSON.stringify(updatedWords));
    toast.success("Word removed");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-[95%] mx-auto">
        <div className="py-8 space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/category/${categoryId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Category
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Other Users Words</h1>
            <p className="text-muted-foreground">Category: {categoryName}</p>
          </div>

          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Filter by word or comment..."
                  value={textFilter}
                  onChange={(e) => {
                    setTextFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Input
                  placeholder="Filter by category..."
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Mechanism</label>
                <Select
                  value={mechanismFilter}
                  onValueChange={(value: Mechanism | "ALL") => {
                    setMechanismFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="BASIC">BASIC</SelectItem>
                    <SelectItem value="TABLE">TABLE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-auto">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("word")}
                        className="flex items-center gap-1"
                      >
                        Word
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-48">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("comment")}
                        className="flex items-center gap-1"
                      >
                        Comment
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-32 text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("category")}
                        className="flex items-center gap-1 w-full justify-center"
                      >
                        Category
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-32 text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("mechanism")}
                        className="flex items-center gap-1 w-full justify-center"
                      >
                        Mechanism
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-32 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedWords().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No words available from other users
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedWords().map((word) => (
                      <TableRow key={word.id}>
                        <TableCell>{renderWordParts(word.wordParts)}</TableCell>
                        <TableCell>{word.comment}</TableCell>
                        <TableCell className="text-center">{word.categoryName}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge variant="secondary">{word.mechanism}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAcceptWord(word)}
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRejectWord(word.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rows per page:</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Custom size"
                    value={customPageSize}
                    onChange={(e) => setCustomPageSize(e.target.value)}
                    className="w-32"
                  />
                  <Button onClick={handleCustomPageSize} size="sm">
                    Apply
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OtherUsersWords;
