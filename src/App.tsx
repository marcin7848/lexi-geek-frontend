import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { StarsProvider } from "@/contexts/StarsContext";
import { useAuthRefresh } from "@/hooks/use-auth-refresh";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Groups from "./pages/Groups";
import AddLanguage from "./pages/AddLanguage";
import LanguageView from "./pages/LanguageView";
import LanguageSettings from "./pages/LanguageSettings";
import CategoryView from "./pages/CategoryView";
import AutomaticTranslate from "./pages/AutomaticTranslate";
import PublicWords from "./pages/PublicWords";
import Repeating from "./pages/Repeating";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Inner component to use hooks
const AppRoutes = () => {
  useAuthRefresh();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/groups/:groupId" element={<Groups />} />
      <Route path="/add-language" element={<AddLanguage />} />
      <Route path="/language/:languageId" element={<LanguageView />} />
      <Route path="/language/:languageId/edit" element={<LanguageSettings />} />
      <Route path="/language/:languageId/repeat" element={<Repeating />} />
      <Route path="/category/:categoryId" element={<CategoryView />} />
      <Route path="/category/:categoryId/auto-translate" element={<AutomaticTranslate />} />
      <Route path="/category/:categoryId/public-words" element={<PublicWords />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <LanguageProvider defaultLanguage="en">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <StarsProvider>
              <AppRoutes />
            </StarsProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
