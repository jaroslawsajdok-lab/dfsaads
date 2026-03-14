import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { cx, apiFetch, eventTypeColor, formatDatePL } from "@/lib/home-helpers";
import { EditableStaticText, SectionReorderControls } from "@/components/admin-tools";
import { Calendar as CalendarIcon, ImagePlus, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

function FeaturedEventPoster() {
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "featured_event_poster"],
    queryFn: () => apiFetch("/api/admin/settings/featured_event_poster"),
  });
  const posterUrl = data?.value || null;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await uploadRes.json();
      await apiRequest("PUT", "/api/admin/settings/featured_event_poster", { value: url });
      qc.invalidateQueries({ queryKey: ["admin-setting", "featured_event_poster"] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="glass rounded-3xl overflow-hidden relative h-full min-h-[200px] flex items-center justify-center" data-testid="card-featured-event-poster">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt="Plakat najbliższego wydarzenia"
          className="h-full w-full object-cover"
          data-testid="img-featured-event-poster"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground p-6 text-center">
          <ImagePlus className="h-10 w-10" />
          <span className="text-sm">Plakat wydarzenia</span>
        </div>
      )}
      {isEditMode && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur transition hover:bg-black/90"
            disabled={uploading}
            data-testid="button-upload-poster"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {uploading ? "Wysyłanie…" : "Zmień plakat"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </>
      )}
    </div>
  );
}

export function SectionKalendarz({ gcalEvents, googleCalendarSrc, isEditMode }: { gcalEvents: any[]; googleCalendarSrc: string; isEditMode: boolean }) {
  const [calView, setCalView] = useState<"week" | "month">("week");
  const calMode = calView === "week" ? "AGENDA" : "MONTH";
  const calSrc = googleCalendarSrc.includes("mode=")
    ? googleCalendarSrc.replace(/mode=\w+/, `mode=${calMode}`)
    : googleCalendarSrc + `&mode=${calMode}`;

  return (
    <section
      id="polecamy"
      className="relative bg-[linear-gradient(180deg,hsl(214_25%_96%),transparent)]"
      data-testid="section-kalendarz"
    >
      <SectionReorderControls sectionId="polecamy" />
      <div id="kalendarz" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div>
            <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-calendar-title">
              <EditableStaticText textKey="calendar_title" defaultValue="Kalendarz" />
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-calendar-subtitle">
              <EditableStaticText textKey="calendar_subtitle" defaultValue="Najbliższe wydarzenia i spotkania." />
            </p>
          </div>

          {gcalEvents.length === 0 ? (
            <p className="mt-8 text-center text-muted-foreground" data-testid="text-no-upcoming-events">Brak nadchodzących wydarzeń w kalendarzu Google.</p>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {gcalEvents.slice(0, 3).map((ev: any, idx: number) => {
                const tc = eventTypeColor(ev.type);
                return (
                  <Card key={`gcal-${idx}`} className={cx("rounded-2xl border p-5 backdrop-blur transition-shadow hover:shadow-md", tc.card)} data-testid={`row-gcal-event-${idx}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cx("rounded-lg px-2.5 py-1 text-xs font-medium", tc.badge)} data-testid={`badge-gcal-type-${idx}`}>
                        {ev.type}
                      </span>
                      <span className="text-sm text-muted-foreground" data-testid={`badge-gcal-date-${idx}`}>
                        {formatDatePL(ev.date)}
                      </span>
                      <span className="text-sm text-muted-foreground" data-testid={`badge-gcal-time-${idx}`}>
                        {ev.time}
                      </span>
                    </div>
                    <div className="mt-3 font-display text-lg leading-snug" data-testid={`text-gcal-title-${idx}`}>
                      {ev.title}
                    </div>
                    {ev.location && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground/60" data-testid={`text-gcal-location-${idx}`}>
                        <MapPin className="h-3 w-3" />
                        {ev.location}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-8 overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm" data-testid="google-calendar-embed">
            <div className="flex items-center justify-between bg-blue-600 px-4 py-2.5 text-white">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Kalendarz parafialny</span>
              </div>
              <div className="flex rounded-lg bg-white/20 p-0.5" data-testid="calendar-view-toggle">
                <button
                  onClick={() => setCalView("week")}
                  className={cx("rounded-md px-3 py-1 text-xs font-medium transition", calView === "week" ? "bg-white text-blue-700" : "text-white/80 hover:text-white")}
                  data-testid="button-cal-week"
                >
                  Tydzień
                </button>
                <button
                  onClick={() => setCalView("month")}
                  className={cx("rounded-md px-3 py-1 text-xs font-medium transition", calView === "month" ? "bg-white text-blue-700" : "text-white/80 hover:text-white")}
                  data-testid="button-cal-month"
                >
                  Miesiąc
                </button>
              </div>
            </div>
            <iframe
              src={calSrc}
              className="w-full border-0"
              style={{ height: calView === "week" ? "450px" : "600px" }}
              title="Kalendarz Google parafii"
              data-testid="iframe-google-calendar"
            />
          </div>

          {isEditMode && (
            <div className="mt-3 text-xs text-muted-foreground">
              URL kalendarza Google (edytowalny w ustawieniach admina jako <code>google_calendar_url</code>)
            </div>
          )}
        </div>
    </section>
  );
}
