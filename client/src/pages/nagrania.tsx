import { useQuery } from "@tanstack/react-query";
import { SubpageLayout } from "@/components/subpage-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Calendar } from "lucide-react";
import { formatDatePL } from "@/lib/utils-date";

type RecordingItem = {
  id: number;
  title: string;
  date: string;
  href: string;
};

type YtVideo = {
  id: string;
  title: string;
  date: string;
  thumbnail: string;
  channelTitle: string;
};

type YtApiResponse = { error: string | null; videos: YtVideo[] };

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function NagraniaPage() {
  const { data: recordings = [], isLoading: loadingRec } = useQuery<RecordingItem[]>({
    queryKey: ["recordings"],
    queryFn: () => apiFetch("/api/recordings"),
  });

  const { data: ytData, isLoading: loadingYt } = useQuery<YtApiResponse>({
    queryKey: ["youtube-videos"],
    queryFn: () => apiFetch("/api/youtube-videos"),
    refetchInterval: 30 * 60 * 1000,
  });

  const ytVideos = ytData?.videos ?? [];
  const useYt = ytVideos.length > 0;
  const isLoading = useYt ? loadingYt : loadingRec;

  return (
    <SubpageLayout title="Nagrania" titleKey="subpage_nagrania_title">
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="nagrania-loading">
          Ładowanie nagrań…
        </div>
      ) : useYt ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="nagrania-grid">
          {ytVideos.map((v) => (
            <a
              key={v.id}
              href={`https://www.youtube.com/watch?v=${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              data-testid={`card-yt-video-${v.id}`}
            >
              <Card className="overflow-hidden transition hover:shadow-md">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                    <div className="rounded-full bg-white/90 p-3">
                      <Play className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDatePL(v.date.slice(0, 10))}
                  </div>
                  <h3 className="mt-1.5 line-clamp-2 font-display text-base leading-snug">{v.title}</h3>
                </div>
              </Card>
            </a>
          ))}
        </div>
      ) : recordings.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="nagrania-empty">
          Brak dostępnych nagrań.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="nagrania-grid">
          {recordings.map((r) => (
            <Card
              key={r.id}
              className="flex flex-col gap-3 p-5"
              data-testid={`card-recording-${r.id}`}
            >
              <h3
                className="font-display text-lg tracking-[-0.01em]"
                data-testid={`text-recording-title-${r.id}`}
              >
                {r.title}
              </h3>
              <span
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
                data-testid={`text-recording-date-${r.id}`}
              >
                <Calendar className="h-4 w-4" />
                {formatDatePL(r.date)}
              </span>
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`link-recording-play-${r.id}`}
              >
                <Button variant="secondary" className="w-full gap-2 rounded-full">
                  <Play className="h-4 w-4" />
                  Odtwórz na YouTube
                </Button>
              </a>
            </Card>
          ))}
        </div>
      )}
    </SubpageLayout>
  );
}
