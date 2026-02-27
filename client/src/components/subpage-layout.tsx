import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { EditableStaticText } from "@/pages/home";

export function SubpageLayout({
  title,
  titleKey,
  children,
}: {
  title: string;
  titleKey?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white" data-testid="subpage-layout">
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-5 pt-6 sm:px-8">
        <Link href="/">
          <img
            src="/parish-cross.svg"
            alt="Logo Parafii"
            className="h-20 w-auto object-contain"
            data-testid="img-subpage-logo"
          />
        </Link>
        <div className="flex flex-col gap-1">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4" />
              <EditableStaticText textKey="subpage_back" defaultValue="Powrót na stronę główną" />
            </Button>
          </Link>
          <h1
            className="font-display text-3xl tracking-[-0.02em] sm:text-4xl"
            data-testid="text-subpage-title"
          >
            {titleKey ? (
              <EditableStaticText textKey={titleKey} defaultValue={title} />
            ) : (
              title
            )}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {children}
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground" data-testid="subpage-footer">
        © {new Date().getFullYear()} <EditableStaticText textKey="subpage_footer" defaultValue="Parafia Ewangelicko-Augsburska w Wiśle Jaworniku" />
      </footer>
    </div>
  );
}
