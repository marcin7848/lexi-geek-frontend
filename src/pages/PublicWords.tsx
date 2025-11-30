import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Word, Mechanism } from "@/types/word";
import { Category } from "@/types/category";
import { categoryService } from "@/services/categoryService";
import { languageService } from "@/services/languageService";
import { publicWordsService } from "@/services/publicWordsService";
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
import { useLanguage } from "@/i18n/LanguageProvider";

type SortColumn = "word" | "comment" | "mechanism" | "category";
type SortDirection = "asc" | "desc";


const PublicWords = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [publicWords, setPublicWords] = useState<Word[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [customPageSize, setCustomPageSize] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [textFilter, setTextFilter] = useState("");
  const [mechanismFilter, setMechanismFilter] = useState<Mechanism | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [languageUuid, setLanguageUuid] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const categoryName = category?.name || "Unknown Category";

  const fetchWords = useCallback(async (langUuid: string, catId: string) => {
    try {
      setLoading(true);
      const response = await publicWordsService.getPublicWords(
        langUuid,
        catId,
        {
          mechanism: mechanismFilter,
          searchText: textFilter || undefined,
          categoryName: categoryFilter || undefined,
        },
        {
          page: currentPage,
          pageSize: pageSize,
        },
        sortColumn ? {
          column: sortColumn,
          direction: sortDirection,
        } : undefined
      );

      setPublicWords(response.words);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching words:", error);
      toast.error(t("publicWords.errorLoading"));
      setPublicWords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortColumn, sortDirection, textFilter, mechanismFilter, categoryFilter, t]);

  // Load category and fetch words
  useEffect(() => {
    const loadData = async () => {
      if (!categoryId) return;

      setLoading(true);
      try {
        // Find category from all languages
        const languages = await languageService.getAll();

        for (const language of languages) {
          const categories = await categoryService.getAll(language.id);
          const found = categories.find((cat) => cat.uuid === categoryId);

          if (found) {
            setCategory(found);
            setLanguageUuid(language.id);

            // Fetch public words
            await fetchWords(language.id, categoryId);
            break;
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(t("publicWords.errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId, fetchWords, t]);

  // Fetch words when filters, pagination, or sorting changes
  useEffect(() => {
    if (languageUuid && categoryId) {
      fetchWords(languageUuid, categoryId);
    }
  }, [fetchWords, languageUuid, categoryId]);

  const renderWordParts = (wordParts: Word["wordParts"]) => {
    const sortedParts = [...wordParts].sort((a, b) => a.position - b.position);
    
    return (
      <div className="flex flex-wrap gap-1 items-center">
        {sortedParts.map((part, index) => {
          if (part.isSeparator) {
            if (part.separatorType === "ENTER") {
              return <div key={index} className="w-full" />;
            } else if (part.separatorType === "TAB") {
              return <span key={index} className="inline-block w-8">{part.basicWord}</span>;
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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const totalPages = Math.ceil(total / pageSize);

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
    }
  };

  const handleAcceptWord = async (word: Word) => {
    if (!languageUuid || !categoryId || !word.uuid) return;

    try {
      await publicWordsService.acceptWord(languageUuid, categoryId, word.uuid);
      toast.success(t("publicWords.wordAdded"));

      // Refresh the list
      await fetchWords(languageUuid, categoryId);
    } catch (error) {
      console.error("Error accepting word:", error);
      toast.error(t("publicWords.errorAccepting"));
    }
  };

  const handleRejectWord = async (word: Word) => {
    if (!languageUuid || !categoryId || !word.uuid) return;

    try {
      await publicWordsService.rejectWord(languageUuid, categoryId, word.uuid);
      toast.success(t("publicWords.wordRemoved"));

      // Refresh the list
      await fetchWords(languageUuid, categoryId);
    } catch (error) {
      console.error("Error rejecting word:", error);
      toast.error(t("publicWords.errorRejecting"));
    }
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
            {t("publicWords.backToCategory")}
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">{t("publicWords.title")}</h1>
            <p className="text-muted-foreground">{t("publicWords.category")} {categoryName}</p>
          </div>

          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">{t("common.search")}</label>
                <Input
                  placeholder={t("publicWords.searchPlaceholder")}
                  value={textFilter}
                  onChange={(e) => {
                    setTextFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">{t("publicWords.categoryFilter")}</label>
                <Input
                  placeholder={t("publicWords.categoryPlaceholder")}
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">{t("publicWords.mechanism")}</label>
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
                    <SelectItem value="ALL">{t("publicWords.all")}</SelectItem>
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
                        {t("publicWords.word")}
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-48">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("comment")}
                        className="flex items-center gap-1"
                      >
                        {t("publicWords.comment")}
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-32 text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("category")}
                        className="flex items-center gap-1 w-full justify-center"
                      >
                        {t("publicWords.category")}
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-32 text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("mechanism")}
                        className="flex items-center gap-1 w-full justify-center"
                      >
                        {t("publicWords.mechanism")}
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-32 text-center">{t("publicWords.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {t("common.loading")}...
                      </TableCell>
                    </TableRow>
                  ) : publicWords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {t("publicWords.noWords")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    publicWords.map((word) => (
                      <TableRow key={word.uuid || word.id}>
                        <TableCell>{renderWordParts(word.wordParts)}</TableCell>
                        <TableCell>{word.comment}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {word.inCategories && word.inCategories.length > 0 ? (
                              word.inCategories.map((cat, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
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
                              disabled={loading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRejectWord(word)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={loading}
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("publicWords.itemsPerPage")}</span>
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
                    placeholder={t("publicWords.custom")}
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
                    {t("publicWords.apply")}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("publicWords.page")} {currentPage} {t("publicWords.of")} {totalPages || 1} ({total} total items)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0 || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicWords;
