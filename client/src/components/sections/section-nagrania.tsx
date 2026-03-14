import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { formatDatePL, apiFetch } from "@/lib/home-helpers";
import type { RecordingItem, YtVideo } from "@/lib/home-helpers";
import { EditableStaticText, EditableText, AdminItemActions, AdminAddButton, SectionReorderControls } from "@/components/admin-tools";
import { ChevronLeft, ChevronRight, Play, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function YtScrollRow({ videos }: { videos: YtVideo[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => { el.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [videos]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (videos.length === 0) return null;

  return (
    <div className="mt-8" data-testid="yt-scroll-row">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-2xl tracking-tight">Starsze transmisje</h3>
        <div className="flex gap-1">
          {canScrollLeft && (
            <button onClick={() => scroll(-1)} className="rounded-full border bg-card p-1.5 text-muted-foreground transition hover:bg-muted" aria-label="Przewiń w lewo">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {canScrollRight && (
            <button onClick={() => scroll(1)} className="rounded-full border bg-card p-1.5 text-muted-foreground transition hover:bg-muted" aria-label="Przewiń w prawo">
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {videos.map((v) => (
          <a
            key={v.id}
            href={`https://www.youtube.com/watch?v=${v.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-[280px] flex-shrink-0 snap-start sm:w-[300px] group"
            data-testid={`card-yt-scroll-${v.id}`}
          >
            <Card className="overflow-hidden rounded-2xl border bg-white/80 dark:bg-card/80 backdrop-blur transition hover:shadow-md">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                  <div className="rounded-full bg-white/90 dark:bg-card/90 p-3"><Play className="h-5 w-5 text-red-600" /></div>
                </div>
              </div>
              <div className="p-3">
                <div className="text-xs text-muted-foreground">{formatDatePL(v.date.slice(0, 10))}</div>
                <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{v.title}</h3>
              </div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}

export function SectionNagrania({ ytVideos, recordingsData }: { ytVideos: any[]; recordingsData: RecordingItem[] }) {
  const { isEditMode } = useAuth();
  const { data: ytUrlData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "youtube_url"],
    queryFn: () => apiFetch("/api/admin/settings/youtube_url"),
  });
  const ytUrl = ytUrlData?.value || "https://www.youtube.com/channel/UCYwTmxRhm2hZDWkeEZngc4g";
  return (
    <section id="nagrania" className="relative bg-muted" data-testid="section-nagrania" aria-label="Nagrania">
      <SectionReorderControls sectionId="nagrania" />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-recordings-title">
              <EditableStaticText textKey="recordings_title" defaultValue="Nagrania" />
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-recordings-subtitle">
              <EditableStaticText textKey="recordings_subtitle" defaultValue="Kazania i materiały wideo z YouTube." />
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <AdminAddButton
                entityType="recordings"
                queryKey="recordings"
                defaultValues={{ title: "", date: "", href: "" }}
                fields={[
                  { key: "title", label: "Tytuł" },
                  { key: "date", label: "Data (RRRR-MM-DD)" },
                  { key: "href", label: "Link YouTube" },
                ]}
              />
            )}
            <Button
              variant="secondary"
              className="rounded-xl"
              asChild
              data-testid="button-recordings-youtube"
            >
              <a href={ytUrl} target="_blank" rel="noreferrer">
                <Youtube className="mr-2 h-4 w-4" />
                YouTube
              </a>
            </Button>
          </div>
        </div>

        {ytVideos.length > 0 ? (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {ytVideos.slice(0, 6).map((v) => (
                <a
                  key={v.id}
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                  data-testid={`card-yt-video-${v.id}`}
                >
                  <Card className="overflow-hidden rounded-2xl border bg-white/80 dark:bg-card/80 backdrop-blur transition hover:shadow-md">
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                        <div className="rounded-full bg-white/90 dark:bg-card/90 p-3"><Play className="h-5 w-5 text-red-600" /></div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-muted-foreground">{formatDatePL(v.date.slice(0, 10))}</div>
                      <h3 className="mt-1 line-clamp-2 font-display text-base leading-snug">{v.title}</h3>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
            <YtScrollRow videos={ytVideos.slice(6)} />
          </>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {recordingsData.slice(0, 3).map((r) => (
              <Card
                key={r.id}
                className="group rounded-2xl border bg-white/80 dark:bg-card/80 p-5 backdrop-blur"
                data-testid={`card-recording-${r.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground" data-testid={`text-recording-date-${r.id}`}>
                    <EditableText value={formatDatePL(r.date)} field="date" entityType="recordings" entityId={r.id} queryKey="recordings" />
                  </div>
                  <div className="flex items-center gap-1">
                    <AdminItemActions entityType="recordings" entityId={r.id} queryKey="recordings" />
                    <div className="rounded-full bg-accent p-2 text-accent-foreground transition group-hover:scale-[1.04]" data-testid={`icon-recording-${r.id}`}>
                      <Play className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 font-display text-xl" data-testid={`text-recording-title-${r.id}`}>
                  <EditableText value={r.title} field="title" entityType="recordings" entityId={r.id} queryKey="recordings" />
                </div>
                <Button
                  variant="ghost"
                  className="mt-3 -ml-2 rounded-xl"
                  onClick={() => window.open(r.href, "_blank", "noopener,noreferrer")}
                  data-testid={`button-recording-open-${r.id}`}
                >
                  Otwórz
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
