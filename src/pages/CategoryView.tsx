import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Category } from "@/types/category";
import { Word, Mechanism } from "@/types/word";
import { mockWordsByCategory } from "@/data/mockWords";
import { toast } from "sonner";
import WordFormModal from "@/components/WordFormModal";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ChevronLeft, ChevronRight, Check, X, ArrowLeft, Book, Dumbbell, ArrowRight, ArrowLeftRight, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SortColumn = "word" | "comment" | "mechanism" | "chosen" | "repeated" | "lastTimestampRepeated" | "created";
type SortDirection = "asc" | "desc";

export default function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [customPageSize, setCustomPageSize] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [textFilter, setTextFilter] = useState("");
  const [mechanismFilter, setMechanismFilter] = useState<Mechanism | "ALL">("ALL");

  // Unaccepted words states
  const [unacceptedCurrentPage, setUnacceptedCurrentPage] = useState(1);
  const [unacceptedPageSize, setUnacceptedPageSize] = useState(20);
  const [unacceptedCustomPageSize, setUnacceptedCustomPageSize] = useState("");
  const [unacceptedSortColumn, setUnacceptedSortColumn] = useState<SortColumn | null>(null);
  const [unacceptedSortDirection, setUnacceptedSortDirection] = useState<SortDirection>("asc");
  const [unacceptedTextFilter, setUnacceptedTextFilter] = useState("");
  const [unacceptedMechanismFilter, setUnacceptedMechanismFilter] = useState<Mechanism | "ALL">("ALL");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [specialLetters, setSpecialLetters] = useState<string>("");
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [categoriesModalWord, setCategoriesModalWord] = useState<Word | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Find category from all languages
    const languages = JSON.parse(localStorage.getItem("languages") || "[]");
    let foundCategory: Category | null = null;
    let foundLanguageId: string | null = null;

    for (const language of languages) {
      const storageKey = `categories_${language.id}`;
      const storedCategories = localStorage.getItem(storageKey);
      
      if (storedCategories) {
        const categories: Category[] = JSON.parse(storedCategories);
        const found = categories.find((cat) => cat.id === Number(categoryId));
        
        if (found) {
          foundCategory = found;
          foundLanguageId = language.id;
          setSpecialLetters(language.specialLetters || "");
          break;
        }
      }
    }

    if (foundCategory) {
      setCategory(foundCategory);
      setLanguageId(foundLanguageId);
      
      // Load all categories for the language
      if (foundLanguageId) {
        const storageKey = `categories_${foundLanguageId}`;
        const storedCategories = localStorage.getItem(storageKey);
        if (storedCategories) {
          setAllCategories(JSON.parse(storedCategories));
        }
      }
      
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

  const handleAcceptWord = (wordId: number) => {
    const updatedWords = words.map((word) =>
      word.id === wordId ? { ...word, accepted: true } : word
    );
    setWords(updatedWords);
    
    const storageKey = `words_${categoryId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedWords));
    toast.success("Word accepted");
  };

  const handleRejectWord = (wordId: number) => {
    const updatedWords = words.filter((word) => word.id !== wordId);
    setWords(updatedWords);
    
    const storageKey = `words_${categoryId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedWords));
    toast.success("Word removed");
  };

  const handleDeleteWord = (wordId: number) => {
    const updatedWords = words.filter((w) => w.id !== wordId);
    setWords(updatedWords);
    localStorage.setItem(`words_${categoryId}`, JSON.stringify(updatedWords));
    toast.success("Word deleted");
  };

  const handleOpenCategoriesModal = (word: Word) => {
    setCategoriesModalWord(word);
    setIsCategoriesModalOpen(true);
  };

  const handleSaveCategories = (categoryNames: string[]) => {
    if (!categoriesModalWord) return;

    const updatedWords = words.map((w) =>
      w.id === categoriesModalWord.id
        ? { ...w, inCategories: categoryNames }
        : w
    );
    setWords(updatedWords);
    localStorage.setItem(`words_${categoryId}`, JSON.stringify(updatedWords));
    toast.success("Categories updated");
  };

  const handleWordAdded = (word: Word) => {
    let updatedWords: Word[];
    
    if (editingWord) {
      // Update existing word
      updatedWords = words.map((w) => (w.id === word.id ? word : w));
    } else {
      // Add new word
      updatedWords = [...words, word];
    }
    
    setWords(updatedWords);
    const storageKey = `words_${categoryId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedWords));
  };

  const handleOpenAddModal = () => {
    setEditingWord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (word: Word) => {
    setEditingWord(word);
    setIsModalOpen(true);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getWordText = (wordParts: Word["wordParts"]) => {
    const sortedParts = [...wordParts].sort((a, b) => a.position - b.position);
    return sortedParts.map((part) => part.word).join(" ");
  };

  const filteredAndSortedWords = (accepted: boolean = true) => {
    let filtered = words.filter((word) => word.accepted === accepted);

    // Apply text filter
    const currentTextFilter = accepted ? textFilter : unacceptedTextFilter;
    if (currentTextFilter) {
      filtered = filtered.filter((word) => {
        const wordText = getWordText(word.wordParts).toLowerCase();
        const commentText = word.comment.toLowerCase();
        const filterText = currentTextFilter.toLowerCase();
        return wordText.includes(filterText) || commentText.includes(filterText);
      });
    }

    // Apply mechanism filter
    const currentMechanismFilter = accepted ? mechanismFilter : unacceptedMechanismFilter;
    if (currentMechanismFilter !== "ALL") {
      filtered = filtered.filter((word) => word.mechanism === currentMechanismFilter);
    }

    // Apply sorting
    const currentSortColumn = accepted ? sortColumn : unacceptedSortColumn;
    if (currentSortColumn) {
      const currentSortDirection = accepted ? sortDirection : unacceptedSortDirection;
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (currentSortColumn) {
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
          case "chosen":
            aValue = a.chosen ? 1 : 0;
            bValue = b.chosen ? 1 : 0;
            break;
          case "repeated":
            aValue = a.repeated;
            bValue = b.repeated;
            break;
          case "lastTimestampRepeated":
            aValue = a.lastTimestampRepeated || 0;
            bValue = b.lastTimestampRepeated || 0;
            break;
          case "created":
            aValue = a.created;
            bValue = b.created;
            break;
        }

        if (aValue < bValue) return currentSortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return currentSortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const paginatedWords = (accepted: boolean = true) => {
    const filtered = filteredAndSortedWords(accepted);
    const currentPg = accepted ? currentPage : unacceptedCurrentPage;
    const currentPgSize = accepted ? pageSize : unacceptedPageSize;
    const startIndex = (currentPg - 1) * currentPgSize;
    const endIndex = startIndex + currentPgSize;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredAndSortedWords(true).length / pageSize);
  const unacceptedTotalPages = Math.ceil(filteredAndSortedWords(false).length / unacceptedPageSize);

  const handlePageSizeChange = (value: string) => {
    if (value === "custom") {
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
    }
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
      <main className="pt-16 px-4 md:px-8 max-w-[95%] mx-auto">
        <div className="py-8 space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/language/${languageId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Language
          </Button>

          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            <div className="flex gap-4 mt-2 text-muted-foreground items-center">
              <span className="flex items-center gap-2">
                Mode: 
                <Badge variant="outline" className="flex items-center gap-1">
                  {category.mode === "Dictionary" ? (
                    <Book className="h-4 w-4 text-primary" />
                  ) : (
                    <Dumbbell className="h-4 w-4 fill-orange-500 text-orange-500" />
                  )}
                  {category.mode}
                </Badge>
              </span>
              <span className="flex items-center gap-2">
                Method: 
                <Badge variant="outline" className="flex items-center gap-1">
                  {category.method === "FirstToSecond" && <ArrowRight className="h-4 w-4" />}
                  {category.method === "SecondToFirst" && <ArrowLeft className="h-4 w-4" />}
                  {category.method === "BothSides" && <ArrowLeftRight className="h-4 w-4" />}
                  {category.method}
                </Badge>
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleOpenAddModal} size="lg">
              Add New Word
            </Button>
            <Button 
              onClick={() => navigate(`/category/${categoryId}/auto-translate`)} 
              variant="secondary"
              size="lg"
            >
              Automatic translation
            </Button>
            <Button 
              onClick={() => navigate(`/category/${categoryId}/other-users-words`)} 
              variant="secondary"
              size="lg"
            >
              Other users words
            </Button>
          </div>

          <WordFormModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            categoryId={categoryId!}
            onWordAdded={handleWordAdded}
            editWord={editingWord}
            specialLetters={specialLetters}
          />

          <ManageCategoriesModal
            open={isCategoriesModalOpen}
            onOpenChange={setIsCategoriesModalOpen}
            categories={allCategories}
            initialCategories={categoriesModalWord?.inCategories || []}
            onSave={handleSaveCategories}
          />

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
                        onClick={() => handleSort("mechanism")}
                        className="flex items-center gap-1 w-full justify-center"
                      >
                        Mechanism
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-24 text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("chosen")}
                        className="flex items-center gap-1 w-full justify-center"
                      >
                        Chosen
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                     <TableHead className="w-28 text-center">
                       <Button
                         variant="ghost"
                         onClick={() => handleSort("repeated")}
                         className="flex items-center gap-1 w-full justify-center"
                       >
                         Repeated
                         <ArrowUpDown className="h-4 w-4" />
                       </Button>
                     </TableHead>
                     <TableHead className="w-40 text-center">In Categories</TableHead>
                      <TableHead className="w-52 text-center">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("created")}
                          className="flex items-center gap-1 w-full justify-center"
                        >
                          Created
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                     <TableHead className="w-52 text-center">
                       <Button
                         variant="ghost"
                         onClick={() => handleSort("lastTimestampRepeated")}
                         className="flex items-center gap-1 w-full justify-center"
                       >
                         Last Repeated
                         <ArrowUpDown className="h-4 w-4" />
                       </Button>
                     </TableHead>
                     <TableHead className="w-32 text-center">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                  <TableBody>
                    {paginatedWords(true).map((word) => (
                     <TableRow 
                       key={word.id}
                       onDoubleClick={() => handleOpenEditModal(word)}
                       className="cursor-pointer"
                     >
                       <TableCell>{renderWordParts(word.wordParts)}</TableCell>
                      <TableCell>{word.comment}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge variant="secondary">{word.mechanism}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={word.chosen}
                            onCheckedChange={(checked) =>
                              handleChosenChange(word.id, checked as boolean)
                            }
                          />
                        </div>
                       </TableCell>
                        <TableCell className="text-center">{word.repeated}</TableCell>
                        <TableCell 
                          className="text-center cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleOpenCategoriesModal(word);
                          }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help truncate block max-w-[150px] mx-auto">
                                  {word.inCategories.length > 0 
                                    ? word.inCategories.join(", ")
                                    : "-"}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  {word.inCategories.length > 0 
                                    ? word.inCategories.join(", ")
                                    : "No categories"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-center">
                          {format(new Date(word.created), "PPp")}
                       </TableCell>
                        <TableCell className="text-center">
                          {word.lastTimestampRepeated
                            ? format(new Date(word.lastTimestampRepeated), "PPp")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(word);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWord(word.id);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>

             {/* Pagination */}
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="1000">1000</SelectItem>
                    <SelectItem value="5000">5000</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Custom"
                    className="w-24"
                    value={customPageSize}
                    onChange={(e) => setCustomPageSize(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCustomPageSize();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCustomPageSize}
                    disabled={!customPageSize}
                  >
                    Apply
                  </Button>
                </div>
              </div>

               <div className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground">
                   Page {currentPage} of {totalPages || 1} ({filteredAndSortedWords(true).length} total items)
                 </span>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                   disabled={currentPage === 1}
                 >
                   <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                   disabled={currentPage === totalPages || totalPages === 0}
                 >
                   <ChevronRight className="h-4 w-4" />
                 </Button>
               </div>
             </div>

             {/* Unaccepted Words Section */}
             <div className="space-y-4 mt-12">
               <h2 className="text-2xl font-bold">Pending Words</h2>

               {/* Filters */}
               <div className="flex gap-4 items-end">
                 <div className="flex-1">
                   <label className="text-sm font-medium mb-2 block">Search</label>
                   <Input
                     placeholder="Filter by word or comment..."
                     value={unacceptedTextFilter}
                     onChange={(e) => {
                       setUnacceptedTextFilter(e.target.value);
                       setUnacceptedCurrentPage(1);
                     }}
                   />
                 </div>
                 <div className="w-48">
                   <label className="text-sm font-medium mb-2 block">Mechanism</label>
                   <Select
                     value={unacceptedMechanismFilter}
                     onValueChange={(value: Mechanism | "ALL") => {
                       setUnacceptedMechanismFilter(value);
                       setUnacceptedCurrentPage(1);
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
                            onClick={() => {
                              if (unacceptedSortColumn === "word") {
                                setUnacceptedSortDirection(unacceptedSortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setUnacceptedSortColumn("word");
                                setUnacceptedSortDirection("asc");
                              }
                            }}
                            className="flex items-center gap-1"
                          >
                            Word
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="w-48">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              if (unacceptedSortColumn === "comment") {
                                setUnacceptedSortDirection(unacceptedSortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setUnacceptedSortColumn("comment");
                                setUnacceptedSortDirection("asc");
                              }
                            }}
                            className="flex items-center gap-1"
                          >
                            Comment
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="w-32 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              if (unacceptedSortColumn === "mechanism") {
                                setUnacceptedSortDirection(unacceptedSortDirection === "asc" ? "desc" : "asc");
                              } else {
                                setUnacceptedSortColumn("mechanism");
                                setUnacceptedSortDirection("asc");
                              }
                            }}
                            className="flex items-center gap-1 w-full justify-center"
                          >
                            Mechanism
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                         </TableHead>
                         <TableHead className="w-40 text-center">In Categories</TableHead>
                         <TableHead className="w-52 text-center">
                           <Button
                             variant="ghost"
                             onClick={() => {
                               if (unacceptedSortColumn === "created") {
                                 setUnacceptedSortDirection(unacceptedSortDirection === "asc" ? "desc" : "asc");
                               } else {
                                 setUnacceptedSortColumn("created");
                                 setUnacceptedSortDirection("asc");
                               }
                             }}
                             className="flex items-center gap-1 w-full justify-center"
                           >
                             Created
                             <ArrowUpDown className="h-4 w-4" />
                           </Button>
                         </TableHead>
                        <TableHead className="w-32 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {paginatedWords(false).map((word) => (
                         <TableRow 
                           key={word.id}
                           onDoubleClick={() => handleOpenEditModal(word)}
                           className={`cursor-pointer ${word.inCategories.length > 0 ? 'bg-primary/5' : ''}`}
                         >
                           <TableCell>{renderWordParts(word.wordParts)}</TableCell>
                          <TableCell>{word.comment}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Badge variant="secondary">{word.mechanism}</Badge>
                            </div>
                          </TableCell>
                          <TableCell 
                            className="text-center cursor-pointer"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleOpenCategoriesModal(word);
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help truncate block max-w-[150px] mx-auto">
                                    {word.inCategories.length > 0 
                                      ? word.inCategories.join(", ")
                                      : "-"}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    {word.inCategories.length > 0 
                                      ? word.inCategories.join(", ")
                                      : "No categories"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center">
                            {format(new Date(word.created), "PPp")}
                         </TableCell>
                         <TableCell className="text-center">
                           <div className="flex gap-2 justify-center">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleAcceptWord(word.id)}
                               className="h-8 w-8 p-0"
                             >
                               <Check className="h-4 w-4 text-green-600" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleRejectWord(word.id)}
                               className="h-8 w-8 p-0"
                             >
                               <X className="h-4 w-4 text-red-600" />
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>

               {/* Pagination */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <span className="text-sm text-muted-foreground">Items per page:</span>
                   <Select 
                     value={unacceptedPageSize.toString()} 
                     onValueChange={(value) => {
                       if (value !== "custom") {
                         setUnacceptedPageSize(Number(value));
                         setUnacceptedCurrentPage(1);
                       }
                     }}
                   >
                     <SelectTrigger className="w-24">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="5">5</SelectItem>
                       <SelectItem value="10">10</SelectItem>
                       <SelectItem value="20">20</SelectItem>
                       <SelectItem value="50">50</SelectItem>
                       <SelectItem value="100">100</SelectItem>
                       <SelectItem value="1000">1000</SelectItem>
                       <SelectItem value="5000">5000</SelectItem>
                     </SelectContent>
                   </Select>
                   <div className="flex items-center gap-2">
                     <Input
                       type="number"
                       placeholder="Custom"
                       className="w-24"
                       value={unacceptedCustomPageSize}
                       onChange={(e) => setUnacceptedCustomPageSize(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const size = Number(unacceptedCustomPageSize);
                            if (size > 0) {
                              setUnacceptedPageSize(size);
                              setUnacceptedCurrentPage(1);
                            }
                          }
                        }}
                     />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const size = Number(unacceptedCustomPageSize);
                          if (size > 0) {
                            setUnacceptedPageSize(size);
                            setUnacceptedCurrentPage(1);
                          }
                        }}
                        disabled={!unacceptedCustomPageSize}
                      >
                        Apply
                      </Button>
                   </div>
                 </div>

                 <div className="flex items-center gap-2">
                   <span className="text-sm text-muted-foreground">
                     Page {unacceptedCurrentPage} of {unacceptedTotalPages || 1} ({filteredAndSortedWords(false).length} total items)
                   </span>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setUnacceptedCurrentPage((prev) => Math.max(1, prev - 1))}
                     disabled={unacceptedCurrentPage === 1}
                   >
                     <ChevronLeft className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setUnacceptedCurrentPage((prev) => Math.min(unacceptedTotalPages, prev + 1))}
                     disabled={unacceptedCurrentPage === unacceptedTotalPages || unacceptedTotalPages === 0}
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
 }
