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

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function NagraniaPage() {
  const { data: recordings = [], isLoading } = useQuery<RecordingItem[]>({
    queryKey: ["recordings"],
    queryFn: () => apiFetch("/api/recordings"),
  });

  return (
    <SubpageLayout title="Nagrania">
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="nagrania-loading">
          Ładowanie nagrań…
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
