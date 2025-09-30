import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AddLanguage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    shortcut: "",
    hidden: false,
    codeForTranslator: "",
    codeForSpeech: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (formData.name.length > 64) {
      newErrors.name = "Name must be less than 64 characters";
    }

    if (formData.shortcut.length < 2) {
      newErrors.shortcut = "Shortcut must be at least 2 characters";
    }

    if (formData.codeForTranslator && formData.codeForTranslator.length < 2) {
      newErrors.codeForTranslator = "Code for translator must be at least 2 characters";
    } else if (formData.codeForTranslator && formData.codeForTranslator.length > 15) {
      newErrors.codeForTranslator = "Code for translator must be less than 15 characters";
    }

    if (formData.codeForSpeech && formData.codeForSpeech.length < 2) {
      newErrors.codeForSpeech = "Code for speech must be at least 2 characters";
    } else if (formData.codeForSpeech && formData.codeForSpeech.length > 15) {
      newErrors.codeForSpeech = "Code for speech must be less than 15 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // Get existing languages from localStorage
    const existingLanguages = JSON.parse(localStorage.getItem("languages") || "[]");
    
    // Add new language with a unique ID
    const newLanguage = {
      id: Date.now().toString(),
      ...formData,
    };

    existingLanguages.push(newLanguage);
    localStorage.setItem("languages", JSON.stringify(existingLanguages));

    toast.success("Language added successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-16 px-4 md:px-8 max-w-2xl mx-auto">
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-6">Add New Language</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter language name"
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortcut">Shortcut *</Label>
              <Input
                id="shortcut"
                value={formData.shortcut}
                onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                placeholder="Enter shortcut"
                required
              />
              {errors.shortcut && <p className="text-sm text-destructive">{errors.shortcut}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hidden"
                checked={formData.hidden}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, hidden: checked as boolean })
                }
              />
              <Label htmlFor="hidden" className="cursor-pointer">Hidden</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeForTranslator">Code for Translator</Label>
              <Input
                id="codeForTranslator"
                value={formData.codeForTranslator}
                onChange={(e) => setFormData({ ...formData, codeForTranslator: e.target.value })}
                placeholder="e.g., en-US"
              />
              {errors.codeForTranslator && (
                <p className="text-sm text-destructive">{errors.codeForTranslator}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeForSpeech">Code for Speech</Label>
              <Input
                id="codeForSpeech"
                value={formData.codeForSpeech}
                onChange={(e) => setFormData({ ...formData, codeForSpeech: e.target.value })}
                placeholder="e.g., en-US"
              />
              {errors.codeForSpeech && (
                <p className="text-sm text-destructive">{errors.codeForSpeech}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit">Add Language</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
