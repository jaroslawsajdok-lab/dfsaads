import { useQuery } from "@tanstack/react-query";
import { SubpageLayout } from "@/components/subpage-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { formatDatePL } from "@/lib/utils-date";

type EventItem = {
  id: number;
  date: string;
  time: string;
  type: string;
  title: string;
  place: string;
  description: string;
};

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function KalendarzPage() {
  const { data: events = [], isLoading } = useQuery<EventItem[]>({
    queryKey: ["events"],
    queryFn: () => apiFetch("/api/events"),
  });

  return (
    <SubpageLayout title="Kalendarz wydarzeń" titleKey="subpage_kalendarz_title">
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="kalendarz-loading">
          Ładowanie wydarzeń…
        </div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="kalendarz-empty">
          Brak nadchodzących wydarzeń.
        </div>
      ) : (
        <div className="grid gap-4" data-testid="kalendarz-list">
          {events.map((e) => (
            <Card
              key={e.id}
              className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:gap-6"
              data-testid={`card-event-${e.id}`}
            >
              <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground sm:w-40 sm:flex-col sm:items-start sm:gap-1">
                <span className="flex items-center gap-1.5" data-testid={`text-event-date-${e.id}`}>
                  <CalendarDays className="h-4 w-4" />
                  {formatDatePL(e.date)}
                </span>
                <span className="flex items-center gap-1.5" data-testid={`text-event-time-${e.id}`}>
                  <Clock className="h-4 w-4" />
                  {e.time}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" data-testid={`badge-event-type-${e.id}`}>
                    {e.type}
                  </Badge>
                  <h3
                    className="font-display text-lg tracking-[-0.01em]"
                    data-testid={`text-event-title-${e.id}`}
                  >
                    {e.title}
                  </h3>
                </div>
                {e.place && (
                  <p
                    className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"
                    data-testid={`text-event-place-${e.id}`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {e.place}
                  </p>
                )}
                {e.description && (
                  <p
                    className="mt-2 text-sm leading-relaxed text-foreground/80"
                    data-testid={`text-event-desc-${e.id}`}
                  >
                    {e.description}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </SubpageLayout>
  );
}
