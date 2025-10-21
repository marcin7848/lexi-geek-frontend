import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { mockCategories } from "@/data/mockCategories";

const AutomaticTranslate = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState("GOOGLE_TRANSLATOR");
  const [text, setText] = useState("");

  const category = mockCategories.find(cat => cat.id === Number(categoryId));
  const categoryName = category?.name || "Unknown Category";

  const handleAutoTranslate = () => {
    // Currently just redirects back to category page
    navigate(`/category/${categoryId}`);
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
            <h1 className="text-3xl font-bold mb-2">Automatic Translation</h1>
            <p className="text-muted-foreground">Category: {categoryName}</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="method">Translation Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="method">
                  <SelectValue placeholder="Select translation method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOGLE_TRANSLATOR">Google Translator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Text to Translate</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Insert the text for automatic translation here..."
                className="min-h-[300px] resize-y"
              />
            </div>

            <Button onClick={handleAutoTranslate} className="w-full">
              Auto Translate
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AutomaticTranslate;
