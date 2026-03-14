import { Link } from "wouter";
import { scrollToId } from "@/lib/home-helpers";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SectionGaleria() {
  return (
    <section id="galeria" className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8" data-testid="section-galeria" aria-label="Galeria">
      <SectionReorderControls sectionId="galeria" />
      <div>
        <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-gallery-title">
          <EditableStaticText textKey="gallery_title" defaultValue="Galeria" />
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-gallery-subtitle">
          <EditableStaticText textKey="gallery_subtitle" defaultValue="Zdjęcia z życia parafii." />
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollToId("kontakt")}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,hsl(205_88%_92%),hsl(220_32%_98%))]"
            data-testid={`tile-gallery-${i}`}
            aria-label="Otwórz galerię"
          >
            <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 hero-overlay" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="glass rounded-full px-3 py-2 text-sm" data-testid={`text-gallery-tile-${i}`}>
                Zobacz
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Button variant="outline" className="rounded-xl" asChild data-testid="button-more-gallery">
          <Link href="/galeria">
            <EditableStaticText textKey="btn_more_gallery" defaultValue="Więcej zdjęć" />
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
