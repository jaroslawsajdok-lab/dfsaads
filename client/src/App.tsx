import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import KalendarzPage from "@/pages/kalendarz";
import GrupyPage from "@/pages/grupy";
import NagraniaPage from "@/pages/nagrania";
import GaleriaPage from "@/pages/galeria";
import FaqPage from "@/pages/faq-page";

const PARISH_LOGO_SRC = "/parish-cross.svg";

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.img
        src={PARISH_LOGO_SRC}
        alt="Logo parafii"
        className="h-24 w-24"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.div
        className="mt-5 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        <div className="font-display text-lg tracking-[-0.02em] text-foreground">
          Parafia Ewangelicka
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Wisła Jawornik
        </div>
      </motion.div>
      <motion.div
        className="mt-8 h-0.5 w-12 rounded-full bg-primary/30"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.4, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

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
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[10000] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
            data-testid="skip-to-content"
          >
            Przejdź do treści
          </a>
          <Toaster />
          <AnimatePresence>
            {showSplash && (
              <SplashScreen onComplete={() => setShowSplash(false)} />
            )}
          </AnimatePresence>
          <main id="main-content" role="main">
            <Router />
          </main>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
