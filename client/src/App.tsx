import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import KalendarzPage from "@/pages/kalendarz";
import GrupyPage from "@/pages/grupy";
import NagraniaPage from "@/pages/nagrania";
import GaleriaPage from "@/pages/galeria";
import FaqPage from "@/pages/faq-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/kalendarz" component={KalendarzPage} />
      <Route path="/grupy" component={GrupyPage} />
      <Route path="/nagrania" component={NagraniaPage} />
      <Route path="/galeria" component={GaleriaPage} />
      <Route path="/faq" component={FaqPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
