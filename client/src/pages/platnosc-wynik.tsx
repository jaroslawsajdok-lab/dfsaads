import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToId } from "@/lib/home-helpers";

export default function PlatnoscWynikPage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const isOk = status === "ok";

  useEffect(() => {
    document.title = isOk ? "Dziękujemy za wpłatę — Parafia Jawornik" : "Płatność anulowana — Parafia Jawornik";
  }, [isOk]);

  function goHome() {
    navigate("/");
    setTimeout(() => scrollToId("kontakt"), 300);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {isOk ? (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="font-display text-2xl tracking-[-0.02em] text-foreground">Dziękujemy za ofiarę!</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Twoja płatność została przyjęta. Otrzymasz potwierdzenie na podany adres e-mail. Niech Bóg błogosławi Twojej hojności.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-16 w-16 text-amber-400" />
            <h1 className="font-display text-2xl tracking-[-0.02em] text-foreground">Płatność anulowana</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Płatność nie została zrealizowana. Możesz spróbować ponownie w sekcji Kontakt.
            </p>
          </>
        )}
        <Button onClick={goHome} className="rounded-xl gap-2">
          <ArrowLeft className="h-4 w-4" />
          Wróć do strony
        </Button>
      </div>
    </div>
  );
}
