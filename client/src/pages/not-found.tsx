import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4" data-testid="page-404">
      <img
        src="/parish-cross.svg"
        alt="Logo parafii"
        className="mb-6 h-20 w-20 opacity-30"
      />
      <h1 className="font-display text-5xl tracking-tight text-foreground" data-testid="text-404-title">
        404
      </h1>
      <p className="mt-3 text-lg text-muted-foreground" data-testid="text-404-message">
        Strona, której szukasz, nie istnieje.
      </p>
      <Button variant="outline" className="mt-8 rounded-xl gap-2" asChild data-testid="button-404-home">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Wróć na stronę główną
        </Link>
      </Button>
    </div>
  );
}
