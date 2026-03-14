import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiFetch, scrollToId } from "@/lib/home-helpers";
import type { RecordingItem, YtApiResponse, ContactMap } from "@/lib/home-helpers";
import { useSectionOrder, EditableStaticText as EST } from "@/components/admin-tools";

export { EditableStaticText } from "@/components/admin-tools";

import { VideoHero } from "@/components/sections/video-hero";
import { TopNav, useStickyNavTrigger } from "@/components/sections/top-nav";
import { WeeklyVerseBanner } from "@/components/sections/weekly-verse";
import { PosterBannerStrip } from "@/components/sections/poster-strip";
import { AdminFloatingBar } from "@/components/sections/admin-bar";
import { SectionAktualnosci } from "@/components/sections/section-aktualnosci";
import { SectionKalendarz } from "@/components/sections/section-kalendarz";
import { SectionNagrania } from "@/components/sections/section-nagrania";
import { SectionGaleria } from "@/components/sections/section-galeria";
import { SectionONas } from "@/components/sections/section-onas";
import { SectionDomGoscinny } from "@/components/sections/section-dom";
import { SectionKontakt } from "@/components/sections/section-kontakt";

export default function HomePage() {
  const stickyShown = useStickyNavTrigger();
  const sectionOrder = useSectionOrder();

  const { data: recordingsData = [] } = useQuery<RecordingItem[]>({ queryKey: ["recordings"], queryFn: () => apiFetch("/api/recordings") });
  const { data: ytData } = useQuery<YtApiResponse>({ queryKey: ["youtube-videos"], queryFn: () => apiFetch("/api/youtube-videos"), refetchInterval: 30 * 60 * 1000 });
  const ytVideos = ytData?.videos ?? [];
  const { data: contactData = {} as any } = useQuery<ContactMap>({ queryKey: ["contact"], queryFn: () => apiFetch("/api/contact") });
  const { data: calendarUrlData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "google_calendar_url"],
    queryFn: () => apiFetch("/api/admin/settings/google_calendar_url"),
  });
  const baseCalendarUrl = calendarUrlData?.value || "https://calendar.google.com/calendar/embed?src=peajawornik%40gmail.com&ctz=Europe%2FWarsaw";
  const googleCalendarSrc = baseCalendarUrl + (baseCalendarUrl.includes("bgcolor") ? "" : "&bgcolor=%23ffffff&showTitle=0&showPrint=0&showTabs=1&showCalendars=0");

  const { data: gcalEventsData } = useQuery<{ error: string | null; events: any[] }>({
    queryKey: ["calendar-events"],
    queryFn: () => apiFetch("/api/calendar-events"),
  });
  const gcalEvents = gcalEventsData?.events ?? [];
  const { isEditMode } = useAuth();

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "aktualnosci":
        return <SectionAktualnosci key="aktualnosci" />;
      case "polecamy":
        return <SectionKalendarz key="polecamy" gcalEvents={gcalEvents} googleCalendarSrc={googleCalendarSrc} isEditMode={isEditMode} />;
      case "nagrania":
        return <SectionNagrania key="nagrania" ytVideos={ytVideos} recordingsData={recordingsData} />;
      case "galeria":
        return <SectionGaleria key="galeria" />;
      case "onas":
        return <SectionONas key="onas" />;
      case "dom":
        return <SectionDomGoscinny key="dom" />;
      case "kontakt":
        return <SectionKontakt key="kontakt" contactData={contactData} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col" data-testid="page-home">
      <main className="flex-1">
        <WeeklyVerseBanner />
        <TopNav shown={stickyShown} />
        <div className="relative">
          <VideoHero />
          <PosterBannerStrip />
        </div>

        <MotionConfig transition={{ layout: { duration: 0.4, ease: "easeInOut" } }}>
          <AnimatePresence mode="popLayout">
            {sectionOrder.map(id => {
              const el = renderSection(id);
              if (!el) return null;
              return (
                <motion.div key={id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  {el}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </MotionConfig>

        <AdminFloatingBar />
      </main>

      <footer className="border-t bg-background px-6 py-6 text-sm text-muted-foreground" data-testid="footer">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div data-testid="text-footer-left">© {new Date().getFullYear()} <EST textKey="footer_text" defaultValue="jawornik.eu" /></div>
          <div className="flex items-center gap-4" data-testid="row-footer-links">
            <Link href="/" data-testid="link-footer-home">Strona główna</Link>
            <button
              type="button"
              onClick={() => scrollToId("top")}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-footer-top"
            >
              Do góry
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
