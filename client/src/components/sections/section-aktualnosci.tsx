import { useQuery } from "@tanstack/react-query";
import { PARISH_LOGO_SRC, scrollToId, apiFetch } from "@/lib/home-helpers";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { FacebookFeed } from "@/components/sections/facebook-feed";
import { Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SectionAktualnosci() {
  const { data: fbUrlData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "facebook_url"],
    queryFn: () => apiFetch("/api/admin/settings/facebook_url"),
  });
  const fbUrl = fbUrlData?.value || "https://www.facebook.com/wislajawornik";

  return (
    <section id="aktualnosci" className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8" data-testid="section-aktualnosci">
      <SectionReorderControls sectionId="aktualnosci" />
      <div className="mb-8">
        <div className="glass rounded-3xl p-5" data-testid="card-afterband">
          <div className="flex items-center gap-3">
            <img
              src={PARISH_LOGO_SRC}
              alt="Logo parafii"
              className="h-16 w-16 rounded-2xl object-contain"
              loading="lazy"
              decoding="async"
              data-testid="img-logo-afterband"
            />
            <div className="font-display text-xl tracking-[-0.02em]" data-testid="text-afterband-title">
              <EditableStaticText textKey="afterband_title" defaultValue="Witaj w parafii" />
            </div>
          </div>
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap" data-testid="text-afterband-sub">
            <EditableStaticText textKey="afterband_sub" defaultValue="Szybkie skróty do najważniejszych sekcji." multiline />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" className="rounded-full" onClick={() => scrollToId("polecamy")} data-testid="button-jump-kalendarz">
              <EditableStaticText textKey="jump_kalendarz" defaultValue="Kalendarz" />
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={() => scrollToId("nagrania")} data-testid="button-jump-nagrania">
              <EditableStaticText textKey="jump_nagrania" defaultValue="Nagrania" />
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={() => scrollToId("kontakt")} data-testid="button-jump-kontakt">
              <EditableStaticText textKey="jump_kontakt" defaultValue="Kontakt" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-news-title">
            <EditableStaticText textKey="news_title" defaultValue="Aktualności" />
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-news-subtitle">
            <EditableStaticText textKey="news_subtitle" defaultValue="Najnowsze informacje i ogłoszenia." />
          </p>
        </div>
        <Button variant="secondary" className="rounded-xl" asChild data-testid="button-news-facebook">
          <a href={fbUrl} target="_blank" rel="noreferrer">
            <Facebook className="mr-2 h-4 w-4" />
            Facebook
          </a>
        </Button>
      </div>
      <FacebookFeed />
    </section>
  );
}
