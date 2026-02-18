import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  Calendar as CalendarIcon,
  ChevronRight,
  Facebook,
  Mail,
  MapPin,
  Phone,
  Play,
  Youtube,
} from "lucide-react";


const PARISH_LOGO_SRC = "/parish-cross.svg";
const CROSS_H = 450;

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type EventItem = {
  id: number;
  date: string;
  time: string;
  type: string;
  title: string;
  place: string;
  description: string;
};

type GroupItem = {
  id: number;
  name: string;
  lead: string;
  when_text: string;
  description: string;
};

type RecordingItem = {
  id: number;
  title: string;
  date: string;
  href: string;
};

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
};

type ContactMap = Record<string, string>;


function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function formatDatePL(isoDate: string) {
  try {
    const d = new Date(`${isoDate}T12:00:00`);
    return d.toLocaleDateString("pl-PL", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return isoDate;
  }
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useStickyNavTrigger() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let shownOnce = false;
    const startedAt = performance.now();

    const maybeShow = () => {
      if (shownOnce) return;
      const elapsed = performance.now() - startedAt;
      const scrolled = window.scrollY > 24;
      if (elapsed >= 3000 || scrolled) {
        shownOnce = true;
        setShown(true);
      }
    };

    const onScroll = () => {
      maybeShow();
    };

    const t = window.setInterval(maybeShow, 120);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearInterval(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return shown;
}

function VideoHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canAutoplay, setCanAutoplay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const attempt = async () => {
      try {
        const p = v.play();
        if (p) await p;
        setCanAutoplay(true);
        setIsPlaying(true);
      } catch {
        setCanAutoplay(false);
        setIsPlaying(false);
      }
    };

    // small delay to let the browser settle
    const t = window.setTimeout(attempt, 120);
    return () => window.clearTimeout(t);
  }, []);

  const onPlayClick = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      await v.play();
      setIsPlaying(true);
      setCanAutoplay(true);
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <section
      id="top"
      className="relative min-h-[100svh] overflow-hidden bg-[hsl(224_32%_7%)]"
      aria-label="Sekcja startowa"
      data-testid="section-hero"
    >
      {/* Background media */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero-poster.png"
          data-testid="video-hero"
        >
          <source src="/hero-drone.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Content — pushed down to clear the cross logo overlay */}
      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-10 sm:px-8" style={{ paddingTop: CROSS_H * 0.5 }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
          className="noise relative"
        >
          <div className="inline-flex items-center gap-3 rounded-full px-5 py-2 text-white/90 glass-dark">
            <span className="text-sm tracking-wide" data-testid="text-hero-pill">
              Wisła Jawornik · jawornik.eu
            </span>
          </div>

          <h1
            className="mt-6 font-display text-4xl leading-[1.03] tracking-[-0.02em] text-white sm:text-6xl"
            data-testid="text-hero-title"
          >
            Parafia Ewangelicka
            <br />
            w Wiśle Jaworniku
          </h1>
          <p
            className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-white/85 sm:text-lg"
            data-testid="text-hero-subtitle"
          >
            Aktualności, kalendarz wydarzeń, grupy parafialne, nagrania i galeria — wszystko w
            jednym miejscu.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="rounded-full"
              onClick={() => scrollToId("aktualnosci")}
              data-testid="button-hero-start"
            >
              Zobacz aktualności
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="rounded-full"
              onClick={() => window.open("https://osrodek.jawornik.eu", "_blank", "noopener,noreferrer")}
              data-testid="button-hero-guesthouse"
            >
              Dom Gościnny
            </Button>

            {!canAutoplay && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/15"
                onClick={onPlayClick}
                data-testid="button-hero-play"
              >
                <Play className="mr-2 h-4 w-4" />
                Odtwórz
              </Button>
            )}

            {canAutoplay && !isPlaying && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/15"
                onClick={onPlayClick}
                data-testid="button-hero-play-fallback"
              >
                <Play className="mr-2 h-4 w-4" />
                Odtwórz
              </Button>
            )}
          </div>
        </motion.div>

        <div className="mt-auto pt-12">
          <button
            type="button"
            onClick={() => scrollToId("aktualnosci")}
            className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-white/80 transition hover:text-white"
            data-testid="button-scroll"
            aria-label="Przewiń do kolejnej sekcji"
          >
            <span className="text-sm" data-testid="text-scroll">Przewiń</span>
            <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

const NAV_ITEMS = [
  { id: "aktualnosci", label: "Aktualności" },
  { id: "kalendarz", label: "Kalendarz" },
  { id: "grupy", label: "Grupy" },
  { id: "nagrania", label: "Nagrania" },
  { id: "galeria", label: "Galeria" },
  { id: "faq", label: "FAQ" },
  { id: "kontakt", label: "Kontakt" },
] as const;

function TopNav({ shown }: { shown: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const barH = Math.round(CROSS_H * 0.2752);
  const barTop = Math.round(CROSS_H * 0.1632);
  const crossW = Math.round(CROSS_H * (53.97 / 87.72));
  const logoAreaW = crossW + 12;

  return (
    <nav
      className={cx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-700",
        shown ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
      )}
      data-testid="nav-wrap"
    >
      {/* White band above the grey bar */}
      <div className="absolute inset-x-0 top-0 bg-white" style={{ height: barTop }} />

      {/* Full-width grey bar — starts after the logo area */}
      <div
        className="absolute right-0 hidden md:block"
        style={{ top: barTop, height: barH, background: "#b0b0b0", left: logoAreaW + 6 }}
        data-testid="nav-bar-full"
      />

      {/* Logo — left side, overlaps hero below */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="absolute left-0 top-0 z-10 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
        style={{ width: crossW, height: CROSS_H, marginLeft: 6 }}
        data-testid="button-nav-logo"
        aria-label="Menu"
      >
        <img
          src={PARISH_LOGO_SRC}
          alt="Logo Parafii Ewangelickiej w Wiśle Jaworniku"
          className="h-full w-full object-contain"
          loading="eager"
          decoding="async"
          data-testid="img-cross-nav"
        />
      </button>

      {/* Desktop: menu items inside the grey bar */}
      <div
        className="absolute hidden md:flex items-center gap-8 px-10"
        style={{ top: barTop, height: barH, left: logoAreaW + 6, right: 0 }}
        data-testid="nav-desktop-items"
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToId(item.id)}
            className="text-[16px] font-semibold tracking-widest text-white uppercase transition-opacity hover:opacity-70"
            data-testid={`link-nav-${item.id}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Dropdown menu — appears below the logo on click */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
            data-testid="nav-dropdown-backdrop"
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 rounded-b-xl bg-white shadow-lg"
            style={{ top: barTop + barH, left: 6, width: Math.max(crossW, 220) }}
            data-testid="nav-dropdown"
          >
            <div className="flex flex-col py-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { scrollToId(item.id); setMenuOpen(false); }}
                  className="px-5 py-3 text-left text-[15px] font-semibold tracking-widest text-gray-700 uppercase transition-colors hover:bg-gray-100 hover:text-gray-900"
                  data-testid={`link-dropdown-${item.id}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Mobile: hamburger-style — same dropdown triggered by logo tap */}
      <div
        className="absolute right-4 flex md:hidden items-center"
        style={{ top: barTop, height: barH }}
        data-testid="nav-mobile-hint"
      >
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
          Menu
        </span>
      </div>
    </nav>
  );
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

declare global {
  interface Window { FB?: { XFBML: { parse: (el?: HTMLElement) => void } } }
}

function FacebookEmbed() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.FB) {
      window.FB.XFBML.parse(ref.current!);
    } else {
      const id = setInterval(() => {
        if (window.FB) {
          window.FB.XFBML.parse(ref.current!);
          clearInterval(id);
        }
      }, 500);
      return () => clearInterval(id);
    }
  }, []);

  return (
    <div ref={ref} className="mt-8 flex justify-center" data-testid="facebook-embed">
      <div
        className="fb-page"
        data-href="https://www.facebook.com/wislajawornik"
        data-tabs="timeline"
        data-width="500"
        data-height="700"
        data-small-header="false"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="true"
      >
        <blockquote
          cite="https://www.facebook.com/wislajawornik"
          className="fb-xfbml-parse-ignore"
        >
          <a href="https://www.facebook.com/wislajawornik">
            Parafia Ewangelicka w Wiśle Jaworniku
          </a>
        </blockquote>
      </div>
    </div>
  );
}

export default function HomePage() {
  const stickyShown = useStickyNavTrigger();

  const { data: eventsData = [] } = useQuery<EventItem[]>({ queryKey: ["events"], queryFn: () => apiFetch("/api/events") });
  const { data: groupsData = [] } = useQuery<GroupItem[]>({ queryKey: ["groups"], queryFn: () => apiFetch("/api/groups") });
  const { data: recordingsData = [] } = useQuery<RecordingItem[]>({ queryKey: ["recordings"], queryFn: () => apiFetch("/api/recordings") });
  const { data: faqData = [] } = useQuery<FaqItem[]>({ queryKey: ["faq"], queryFn: () => apiFetch("/api/faq") });
  const { data: contactData = {} } = useQuery<ContactMap>({ queryKey: ["contact"], queryFn: () => apiFetch("/api/contact") });

  return (
    <main className="min-h-screen" data-testid="page-home">
      <TopNav shown={stickyShown} />
      <VideoHero />

      {/* Aktualności */}
      <section
        id="aktualnosci"
        className="mx-auto max-w-6xl px-5 py-16 sm:px-8"
        data-testid="section-aktualnosci"
      >
        <div className="mb-8 grid gap-4 md:grid-cols-12" data-testid="hero-afterband">
          <div className="md:col-span-7">
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
                <div>
                  <div className="font-display text-xl tracking-[-0.02em]" data-testid="text-afterband-title">
                    Witaj w parafii
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="text-afterband-sub">
                    Szybkie skróty do najważniejszych sekcji.
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => scrollToId("polecamy")}
                  data-testid="button-jump-kalendarz"
                >
                  Kalendarz
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => scrollToId("nagrania")}
                  data-testid="button-jump-nagrania"
                >
                  Nagrania
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => scrollToId("kontakt")}
                  data-testid="button-jump-kontakt"
                >
                  Kontakt
                </Button>
              </div>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="glass rounded-3xl p-5" data-testid="card-afterband-cta">
              <div className="text-xs text-muted-foreground" data-testid="text-afterband-cta-kicker">
                Wyróżnione
              </div>
              <div className="mt-2 font-display text-2xl tracking-[-0.02em]" data-testid="text-afterband-cta-title">
                Remont Domu Gościnnego
              </div>
              <p className="mt-2 text-sm text-muted-foreground" data-testid="text-afterband-cta-desc">
                Zobacz informacje i aktualny status prac.
              </p>
              <Button
                className="mt-4 w-full rounded-2xl"
                onClick={() => window.open("https://osrodek.jawornik.eu", "_blank", "noopener,noreferrer")}
                data-testid="button-afterband-remont"
              >
                Przejdź
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-news-title">
              Aktualności
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-news-subtitle">
              Najnowsze informacje i ogłoszenia.
            </p>
          </div>
          <Button
            variant="secondary"
            className="rounded-xl"
            asChild
            data-testid="button-news-facebook"
          >
            <a
              href="https://www.facebook.com/wislajawornik"
              target="_blank"
              rel="noreferrer"
            >
              <Facebook className="mr-2 h-4 w-4" />
              Facebook
            </a>
          </Button>
        </div>

        <FacebookEmbed />
      </section>

      {/* Kalendarz */}
      <section
        id="polecamy"
        className="bg-[linear-gradient(180deg,hsl(214_25%_96%),transparent)]"
        data-testid="section-kalendarz"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-calendar-title">
                Kalendarz
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-calendar-subtitle">
                Najbliższe wydarzenia i spotkania.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-2xl px-3 py-2 glass" data-testid="card-calendar-mini">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="text-sm" data-testid="text-calendar-mini">Najbliższe 30 dni</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              {eventsData.map((e) => (
                <Card
                  key={e.id}
                  className="rounded-2xl border bg-white/75 p-5 backdrop-blur"
                  data-testid={`row-event-${e.id}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`text-event-meta-${e.id}`}>
                        <span className="rounded-lg bg-secondary px-2 py-1" data-testid={`badge-event-date-${e.id}`}>
                          {formatDatePL(e.date)}
                        </span>
                        <span className="rounded-lg bg-secondary px-2 py-1" data-testid={`badge-event-time-${e.id}`}>
                          {e.time}
                        </span>
                        <Badge variant="secondary" data-testid={`badge-event-type-${e.id}`}>
                          {e.type}
                        </Badge>
                      </div>
                      <div className="mt-2 font-display text-xl" data-testid={`text-event-title-${e.id}`}>
                        {e.title}
                      </div>
                      <div className="mt-1 text-sm text-foreground/80" data-testid={`text-event-place-${e.id}`}>
                        {e.place}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground" data-testid={`text-event-desc-${e.id}`}>
                        {e.description}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => scrollToId("kontakt")}
                      data-testid={`button-event-details-${e.id}`}
                    >
                      Szczegóły
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="rounded-2xl border bg-white/70 p-5 backdrop-blur" data-testid="card-calendar-aside">
              <div className="font-display text-lg" data-testid="text-calendar-aside-title">Skrót</div>
              <p className="mt-2 text-sm text-muted-foreground" data-testid="text-calendar-aside-desc">
                W przyszłości: mini-kalendarz + filtrowanie typów wydarzeń.
              </p>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-start gap-3" data-testid="row-calendar-note">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm" data-testid="text-calendar-note-title">Dodaj wydarzenie</div>
                    <div className="text-xs text-muted-foreground" data-testid="text-calendar-note-sub">
                      Edytowalne w panelu WordPress.
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={() => scrollToId("kontakt")}
                  data-testid="button-calendar-contact"
                >
                  Zgłoś wydarzenie
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Grupy */}
      <section id="onas" className="mx-auto max-w-6xl px-5 py-16 sm:px-8" data-testid="section-grupy">
        <div>
          <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-groups-title">
            Grupy w parafii
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-groups-subtitle">
            Dołącz do wspólnoty — znajdź przestrzeń dla siebie.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {groupsData.map((g) => (
            <Card
              key={g.id}
              className="rounded-2xl border bg-white/80 p-5 shadow-[0_1px_0_hsl(220_20%_88%/.7)] backdrop-blur"
              data-testid={`card-group-${g.id}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-xl" data-testid={`text-group-name-${g.id}`}>{g.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-group-lead-${g.id}`}>{g.lead}</div>
                </div>
                <div className="rounded-xl bg-accent px-2 py-1 text-xs text-accent-foreground" data-testid={`badge-group-when-${g.id}`}
                >
                  {g.when_text}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80" data-testid={`text-group-desc-${g.id}`}>
                {g.description}
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => scrollToId("kontakt")}
                  data-testid={`button-group-join-${g.id}`}
                >
                  Dołącz
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Nagrania */}
      <section id="nagrania" className="bg-[linear-gradient(180deg,transparent,hsl(214_25%_96%))]" data-testid="section-nagrania">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-recordings-title">
                Nagrania
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-recordings-subtitle">
                Kazania i materiały wideo z YouTube.
              </p>
            </div>
            <Button
              variant="secondary"
              className="rounded-xl"
              asChild
              data-testid="button-recordings-youtube"
            >
              <a
                href="https://www.youtube.com/@parafiae-awisajawornik2251"
                target="_blank"
                rel="noreferrer"
              >
                <Youtube className="mr-2 h-4 w-4" />
                YouTube
              </a>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {recordingsData.map((r) => (
              <Card
                key={r.id}
                className="group rounded-2xl border bg-white/80 p-5 backdrop-blur"
                data-testid={`card-recording-${r.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground" data-testid={`text-recording-date-${r.id}`}>
                    {formatDatePL(r.date)}
                  </div>
                  <div className="rounded-full bg-accent p-2 text-accent-foreground transition group-hover:scale-[1.04]" data-testid={`icon-recording-${r.id}`}>
                    <Play className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 font-display text-xl" data-testid={`text-recording-title-${r.id}`}>
                  {r.title}
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
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="mx-auto max-w-6xl px-5 py-16 sm:px-8" data-testid="section-galeria">
        <div>
          <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-gallery-title">
            Galeria
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-gallery-subtitle">
            Przykładowa siatka — docelowo zdjęcia z biblioteki mediów.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[linear-gradient(180deg,hsl(214_25%_96%),transparent)]" data-testid="section-faq">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div>
            <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-faq-title">
              FAQ
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-faq-subtitle">
              Najczęstsze pytania — krótkie odpowiedzi.
            </p>
          </div>

          <div className="mt-8">
            <Accordion type="single" collapsible className="w-full" data-testid="accordion-faq">
              {faqData.map((item, idx) => (
                <AccordionItem key={item.id} value={`i-${item.id}`} data-testid={`faq-item-${idx}`}>
                  <AccordionTrigger data-testid={`button-faq-${idx}`}>{item.question}</AccordionTrigger>
                  <AccordionContent data-testid={`text-faq-${idx}`}>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Dom Gościnny */}
      <section id="dom" className="mx-auto max-w-6xl px-5 py-16 sm:px-8" data-testid="section-dom">
        <Card className="relative overflow-hidden rounded-3xl border bg-white/80 p-7 backdrop-blur" data-testid="card-guesthouse">
          <div className="absolute inset-0 hero-overlay opacity-35" />
          <div className="relative grid gap-6 md:grid-cols-3 md:items-center">
            <div className="md:col-span-2">
              <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-guesthouse-title">
                Dom Gościnny
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-guesthouse-subtitle">
                Ośrodek wypoczynkowy i miejsce spotkań. Szczegóły, zdjęcia i rezerwacje:
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="rounded-2xl"
                onClick={() => window.open("https://osrodek.jawornik.eu", "_blank", "noopener,noreferrer")}
                data-testid="button-guesthouse-open"
              >
                Przejdź do strony
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground" data-testid="text-guesthouse-note">
                Link otworzy się w nowej karcie.
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Kontakt */}
      <section id="kontakt" className="bg-[linear-gradient(180deg,transparent,hsl(214_25%_96%))]" data-testid="section-kontakt">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div>
            <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-contact-title">
              Kontakt
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-contact-subtitle">
              Dane kontaktowe oraz formularz (docelowo: Contact Form 7 / WPForms).
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl border bg-white/80 p-6 backdrop-blur" data-testid="card-contact-details">
              <div className="space-y-4">
                <div className="flex items-start gap-3" data-testid="row-contact-address">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium" data-testid="text-contact-address-title">Adres</div>
                    <div className="text-sm text-muted-foreground" data-testid="text-contact-address">
                      {contactData.address || "(uzupełnij adres)"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="row-contact-phone">
                  <Phone className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium" data-testid="text-contact-phone-title">Telefon</div>
                    <div className="text-sm text-muted-foreground" data-testid="text-contact-phone">
                      {contactData.phone || "(uzupełnij telefon)"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="row-contact-mail">
                  <Mail className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium" data-testid="text-contact-mail-title">E-mail</div>
                    <div className="text-sm text-muted-foreground" data-testid="text-contact-mail">
                      {contactData.email || "(uzupełnij e-mail)"}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3" data-testid="row-contact-hours">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm font-medium" data-testid="text-contact-hours-title">Godziny</div>
                    <div className="text-sm text-muted-foreground" data-testid="text-contact-hours">
                      {contactData.hours || "(uzupełnij godziny)"}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2" data-testid="row-contact-links">
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    asChild
                    data-testid="button-contact-facebook"
                  >
                    <a href="https://www.facebook.com/wislajawornik" target="_blank" rel="noreferrer">
                      <Facebook className="mr-2 h-4 w-4" />
                      Facebook
                    </a>
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    asChild
                    data-testid="button-contact-youtube"
                  >
                    <a
                      href="https://www.youtube.com/@parafiae-awisajawornik2251"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Youtube className="mr-2 h-4 w-4" />
                      YouTube
                    </a>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border bg-white/80 p-6 backdrop-blur lg:col-span-2" data-testid="card-contact-form">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium" data-testid="text-form-title">Formularz</div>
                  <p className="mt-1 text-sm text-muted-foreground" data-testid="text-form-subtitle">
                    Placeholder pod shortcode formularza.
                  </p>
                </div>
                <div className="flex md:justify-end">
                  <div className="rounded-2xl px-4 py-2 glass" data-testid="text-form-shortcode">
                    [contact-form-7 id="..."]
                  </div>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border bg-white/70 px-4 py-3" data-testid="field-name">
                  <div className="text-xs text-muted-foreground" data-testid="label-name">Imię</div>
                  <div className="mt-1 text-sm" data-testid="value-name">(wtyczka formularza)</div>
                </div>
                <div className="rounded-2xl border bg-white/70 px-4 py-3" data-testid="field-email">
                  <div className="text-xs text-muted-foreground" data-testid="label-email">E-mail</div>
                  <div className="mt-1 text-sm" data-testid="value-email">(wtyczka formularza)</div>
                </div>
                <div className="md:col-span-2 rounded-2xl border bg-white/70 px-4 py-3" data-testid="field-message">
                  <div className="text-xs text-muted-foreground" data-testid="label-message">Wiadomość</div>
                  <div className="mt-1 text-sm" data-testid="value-message">(wtyczka formularza)</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground" data-testid="text-form-note">
                  Po wdrożeniu: formularz wysyła z WordPress.
                </div>
                <Button className="rounded-xl" disabled data-testid="button-form-send">
                  Wyślij
                </Button>
              </div>

              <Separator className="my-5" />

              <div className="rounded-2xl border bg-white/60 p-3" data-testid="map-wrap">
                <div className="text-sm font-medium" data-testid="text-map-title">Mapa</div>
                <div className="mt-2 aspect-[16/9] w-full overflow-hidden rounded-xl bg-secondary" data-testid="map-embed">
                  <div className="grid h-full w-full place-items-center text-sm text-muted-foreground" data-testid="text-map-placeholder">
                    (embed mapy — w WordPress)
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <footer className="mt-10 flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between" data-testid="footer">
            <div data-testid="text-footer-left">© {new Date().getFullYear()} jawornik.eu</div>
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
          </footer>
        </div>
      </section>
    </main>
  );
}
