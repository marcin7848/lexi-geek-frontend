import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Category } from "@/types/category";
import { Word, Mechanism } from "@/types/word";
import { toast } from "sonner";
import { categoryService } from "@/services/categoryService";
import { languageService } from "@/services/languageService";
import { wordService, type WordForm, type WordFilters, type PaginationParams, type SortParams } from "@/services/wordService";
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

type SortColumn = "word" | "comment" | "mechanism" | "chosen" | "repeated" | "lastTimeRepeated" | "created";
type SortDirection = "asc" | "desc";

export default function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [customPageSize, setCustomPageSize] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [textFilter, setTextFilter] = useState("");
  const [mechanismFilter, setMechanismFilter] = useState<Mechanism | "ALL">("ALL");

  // Unaccepted words states
  const [unacceptedWords, setUnacceptedWords] = useState<Word[]>([]);
  const [unacceptedTotalWords, setUnacceptedTotalWords] = useState(0);
  const [unacceptedTotalPages, setUnacceptedTotalPages] = useState(1);
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

  useEffect(() => {
    const loadData = async () => {
      if (!categoryId) return;

      try {
        // Find category from all languages
        const languages = await languageService.getAll();
        let foundCategory: Category | null = null;
        let foundLanguageId: string | null = null;

        for (const language of languages) {
          const categories = await categoryService.getAll(language.id);
          const found = categories.find((cat) => cat.uuid === categoryId);

          if (found) {
            foundCategory = found;
            foundLanguageId = language.id;
            setSpecialLetters(language.specialLetters || "");
            break;
          }
        }

        if (foundCategory) {
          setCategory(foundCategory);
          setLanguageId(foundLanguageId);
        } else {
          toast.error("Category not found");
          navigate(-1);
        }
      } catch (error) {
        console.error("Error loading category:", error);
        toast.error("Failed to load category");
        navigate(-1);
      }
    };

    loadData();
  }, [categoryId, navigate]);

  // Load accepted words when filters, sorting, or pagination changes
  useEffect(() => {
    const loadAcceptedWords = async () => {
      if (!languageId || !categoryId) return;

      try {
        const filters: WordFilters = {
          accepted: true,
          mechanism: mechanismFilter,
          searchText: textFilter || undefined,
        };

        const pagination: PaginationParams = {
          page: currentPage,
          pageSize: pageSize,
        };

        const sort: SortParams | undefined = sortColumn
          ? { column: sortColumn, direction: sortDirection }
          : undefined;

        const response = await wordService.getWords(
          languageId,
          categoryId,
          filters,
          pagination,
          sort
        );

        setWords(response.words);
        setTotalWords(response.total);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error("Error loading accepted words:", error);
        toast.error("Failed to load words");
      }
    };

    loadAcceptedWords();
  }, [languageId, categoryId, currentPage, pageSize, sortColumn, sortDirection, textFilter, mechanismFilter]);

  // Load unaccepted words when filters, sorting, or pagination changes
  useEffect(() => {
    const loadUnacceptedWords = async () => {
      if (!languageId || !categoryId) return;

      try {
        const filters: WordFilters = {
          accepted: false,
          mechanism: unacceptedMechanismFilter,
          searchText: unacceptedTextFilter || undefined,
        };

        const pagination: PaginationParams = {
          page: unacceptedCurrentPage,
          pageSize: unacceptedPageSize,
        };

        const sort: SortParams | undefined = unacceptedSortColumn
          ? { column: unacceptedSortColumn, direction: unacceptedSortDirection }
          : undefined;

        const response = await wordService.getWords(
          languageId,
          categoryId,
          filters,
          pagination,
          sort
        );

        setUnacceptedWords(response.words);
        setUnacceptedTotalWords(response.total);
        setUnacceptedTotalPages(response.totalPages);
      } catch (error) {
        console.error("Error loading unaccepted words:", error);
        toast.error("Failed to load unaccepted words");
      }
    };

    loadUnacceptedWords();
  }, [languageId, categoryId, unacceptedCurrentPage, unacceptedPageSize, unacceptedSortColumn, unacceptedSortDirection, unacceptedTextFilter, unacceptedMechanismFilter]);

  // Helper function to reload accepted words
  const reloadAcceptedWords = async () => {
    if (!languageId || !categoryId) return;

    try {
      const filters: WordFilters = {
        accepted: true,
        mechanism: mechanismFilter,
        searchText: textFilter || undefined,
      };

      const pagination: PaginationParams = {
        page: currentPage,
        pageSize: pageSize,
      };

      const sort: SortParams | undefined = sortColumn
        ? { column: sortColumn, direction: sortDirection }
        : undefined;

      const response = await wordService.getWords(
        languageId,
        categoryId,
        filters,
        pagination,
        sort
      );

      setWords(response.words);
      setTotalWords(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error reloading accepted words:", error);
      toast.error("Failed to reload words");
    }
  };

  // Helper function to reload unaccepted words
  const reloadUnacceptedWords = async () => {
    if (!languageId || !categoryId) return;

    try {
      const filters: WordFilters = {
        accepted: false,
        mechanism: unacceptedMechanismFilter,
        searchText: unacceptedTextFilter || undefined,
      };

      const pagination: PaginationParams = {
        page: unacceptedCurrentPage,
        pageSize: unacceptedPageSize,
      };

      const sort: SortParams | undefined = unacceptedSortColumn
        ? { column: unacceptedSortColumn, direction: unacceptedSortDirection }
        : undefined;

      const response = await wordService.getWords(
        languageId,
        categoryId,
        filters,
        pagination,
        sort
      );

      setUnacceptedWords(response.words);
      setUnacceptedTotalWords(response.total);
      setUnacceptedTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error reloading unaccepted words:", error);
      toast.error("Failed to reload unaccepted words");
    }
  };

  const handleChosenChange = async (wordId: number, checked: boolean) => {
    if (!languageId || !categoryId) return;

    const word = words.find((w) => w.id === wordId);
    if (!word || !word.uuid) return;

    try {
      // The /choose endpoint works as a toggle, so we just call it regardless of checked state
      await wordService.chooseWord(languageId, categoryId, word.uuid);

      // Reload data from backend
      await reloadAcceptedWords();
    } catch (error) {
      console.error("Error updating word:", error);
      toast.error("Failed to update word");
    }
  };

  const handleAcceptWord = async (wordId: number) => {
    if (!languageId || !categoryId) return;

    const word = unacceptedWords.find((w) => w.id === wordId);
    if (!word || !word.uuid) return;

    try {
      await wordService.acceptWord(languageId, categoryId, word.uuid);

      // Reload both tables since word moved from unaccepted to accepted
      await Promise.all([reloadAcceptedWords(), reloadUnacceptedWords()]);
      toast.success("Word accepted");
    } catch (error) {
      console.error("Error accepting word:", error);
      toast.error("Failed to accept word");
    }
  };

  const handleRejectWord = async (wordId: number) => {
    if (!languageId || !categoryId) return;

    const word = unacceptedWords.find((w) => w.id === wordId);
    if (!word || !word.uuid) return;

    try {
      await wordService.deleteWord(languageId, categoryId, word.uuid);

      // Reload unaccepted words table
      await reloadUnacceptedWords();
      toast.success("Word removed");
    } catch (error) {
      console.error("Error removing word:", error);
      toast.error("Failed to remove word");
    }
  };

  const handleDeleteWord = async (wordId: number) => {
    if (!languageId || !categoryId) return;

    const word = words.find((w) => w.id === wordId);
    if (!word || !word.uuid) return;

    try {
      await wordService.deleteWord(languageId, categoryId, word.uuid);

      // Reload accepted words table
      await reloadAcceptedWords();
      toast.success("Word deleted");
    } catch (error) {
      console.error("Error deleting word:", error);
      toast.error("Failed to delete word");
    }
  };

  const handleOpenCategoriesModal = (word: Word) => {
    setCategoriesModalWord(word);
    setIsCategoriesModalOpen(true);
  };

  const handleSaveCategories = async (categoryUuids: string[]) => {
    if (!categoriesModalWord || !languageId || !categoriesModalWord.uuid) return;

    try {
      // Call the API to update word categories
      const updatedWord = await wordService.updateWordCategories(
        languageId,
        categoriesModalWord.uuid,
        categoryUuids
      );

      // Update local state with the updated word
      setWords(prevWords =>
        prevWords.map(w => w.uuid === updatedWord.uuid ? updatedWord : w)
      );

      setUnacceptedWords(prevWords =>
        prevWords.map(w => w.uuid === updatedWord.uuid ? updatedWord : w)
      );

      toast.success("Categories updated successfully");
    } catch (error) {
      console.error("Error updating categories:", error);
      toast.error("Failed to update categories");
    }
  };

  const handleWordAdded = async (word: Word) => {
    if (!languageId || !categoryId) return;

    try {
      const wordForm: WordForm = {
        comment: word.comment || null,
        mechanism: word.mechanism,
        wordParts: word.wordParts.map((part) => ({
          answer: part.answer,
          basicWord: part.basicWord || null,
          position: part.position,
          toSpeech: part.toSpeech,
          separator: part.isSeparator || false,
          separatorType: part.separatorType || null,
          word: part.word || null,
        })),
      };

      if (editingWord && editingWord.uuid) {
        // Update existing word
        await wordService.updateWord(
          languageId,
          categoryId,
          editingWord.uuid,
          wordForm
        );
        // Reload appropriate table based on word's accepted status
        if (editingWord.accepted) {
          await reloadAcceptedWords();
        } else {
          await reloadUnacceptedWords();
        }
        toast.success("Word updated");
      } else {
        // Create new word
        await wordService.createWord(languageId, categoryId, wordForm);
        // New words are typically unaccepted, but reload both to be safe
        await Promise.all([reloadAcceptedWords(), reloadUnacceptedWords()]);
        toast.success("Word added");
      }
    } catch (error) {
      console.error("Error saving word:", error);
      toast.error("Failed to save word");
    }
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
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleUnacceptedSort = (column: SortColumn) => {
    if (unacceptedSortColumn === column) {
      setUnacceptedSortDirection(unacceptedSortDirection === "asc" ? "desc" : "asc");
    } else {
      setUnacceptedSortColumn(column);
      setUnacceptedSortDirection("asc");
    }
    setUnacceptedCurrentPage(1); // Reset to first page when sorting changes
  };

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
        {sortedParts.map((part, index) => {
          if (part.isSeparator) {
            if (part.separatorType === "ENTER") {
              return <div key={index} className="w-full" />;
            } else if (part.separatorType === "TAB") {
              return <span key={index} className="inline-block w-8"></span>;
            } else if (part.separatorType === "MULTI_DASH") {
              return <span key={index} className="mx-1">{part.basicWord}</span>;
            }
          }
          
          return (
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
              {part.basicWord && !part.isSeparator && (
                <span className="text-muted-foreground text-sm ml-1">
                  ({part.basicWord})
                </span>
              )}
            </span>
          );
        })}
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
                  {category.mode === "DICTIONARY" ? (
                    <Book className="h-4 w-4 text-primary" />
                  ) : (
                    <Dumbbell className="h-4 w-4 fill-orange-500 text-orange-500" />
                  )}
                  {category.mode === "DICTIONARY" ? "Dictionary" : "Exercise"}
                </Badge>
              </span>
              <span className="flex items-center gap-2">
                Method: 
                <Badge variant="outline" className="flex items-center gap-1">
                  {category.method === "QUESTION_TO_ANSWER" && <ArrowRight className="h-4 w-4" />}
                  {category.method === "ANSWER_TO_QUESTION" && <ArrowLeft className="h-4 w-4" />}
                  {category.method === "BOTH" && <ArrowLeftRight className="h-4 w-4" />}
                  {category.method === "QUESTION_TO_ANSWER" ? "Question → Answer" : category.method === "ANSWER_TO_QUESTION" ? "Answer → Question" : "Both"}
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
            languageUuid={languageId || ""}
            initialCategoryNames={categoriesModalWord?.inCategories || []}
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
                      Word
                    </TableHead>
                    <TableHead className="w-48">
                      Comment
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
                         onClick={() => handleSort("lastTimeRepeated")}
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
                    {words.map((word) => (
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
                   Page {currentPage} of {totalPages || 1} ({totalWords} total items)
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
                          Word
                        </TableHead>
                        <TableHead className="w-48">
                          Comment
                        </TableHead>
                        <TableHead className="w-32 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleUnacceptedSort("mechanism")}
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
                             onClick={() => handleUnacceptedSort("created")}
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
                       {unacceptedWords.map((word) => (
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
                     Page {unacceptedCurrentPage} of {unacceptedTotalPages || 1} ({unacceptedTotalWords} total items)
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
