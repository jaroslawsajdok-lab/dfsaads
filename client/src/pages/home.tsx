import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowDown,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Share2,
  ThumbsUp,
  Youtube,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
  LogIn,
  LogOut,
  Settings,
  ImagePlus,
  Video,
} from "lucide-react";


const PARISH_LOGO_SRC = "/parish-cross.svg";
const CROSS_H_DESKTOP = 450;
const CROSS_H_MOBILE = 56;

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
import { BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type WeeklyVerseData = {
  week_text: string | null;
  week_source: string | null;
  name: string;
  date: string;
};

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
  image_url: string | null;
};

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

function eventTypeColor(type: string) {
  const t = type.toLowerCase();
  if (t.includes("nabożeństwo") || t.includes("nabożeń")) return { badge: "bg-blue-100 text-blue-700", card: "bg-blue-50/80 border-blue-200/60" };
  if (t.includes("spotkanie")) return { badge: "bg-amber-100 text-amber-700", card: "bg-amber-50/80 border-amber-200/60" };
  if (t.includes("koncert") || t.includes("muzyk")) return { badge: "bg-purple-100 text-purple-700", card: "bg-purple-50/80 border-purple-200/60" };
  if (t.includes("konferencja")) return { badge: "bg-emerald-100 text-emerald-700", card: "bg-emerald-50/80 border-emerald-200/60" };
  return { badge: "bg-rose-100 text-rose-700", card: "bg-white/75 border-rose-200/40" };
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
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: heroVideoData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "hero_video_url"],
    queryFn: () => apiFetch("/api/admin/settings/hero_video_url"),
  });
  const heroVideoSrc = heroVideoData?.value || "/hero-drone.mp4";

  const { data: heroSpeedData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "hero_video_speed"],
    queryFn: () => apiFetch("/api/admin/settings/hero_video_speed"),
  });
  const heroSpeed = parseFloat(heroSpeedData?.value || "1");

  const { data: heroLoopData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "hero_video_loop"],
    queryFn: () => apiFetch("/api/admin/settings/hero_video_loop"),
  });
  const heroLoop = heroLoopData?.value !== "false";

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = heroSpeed;
  }, [heroSpeed, heroVideoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.loop = heroLoop;
  }, [heroLoop, heroVideoSrc]);

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

    const t = window.setTimeout(attempt, 120);
    return () => window.clearTimeout(t);
  }, [heroVideoSrc]);

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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("POST", "/api/upload-video");
        xhr.withCredentials = true;
        xhr.send(fd);
      });
      qc.invalidateQueries({ queryKey: ["admin-setting", "hero_video_url"] });
    } finally {
      setVideoUploading(false);
      setUploadProgress(0);
      if (videoFileRef.current) videoFileRef.current.value = "";
    }
  };

  const saveVideoSetting = async (key: string, value: string) => {
    await fetch(`/api/admin/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ value }),
    });
    qc.invalidateQueries({ queryKey: ["admin-setting", key] });
  };

  const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <section
      id="top"
      className="relative min-h-[100svh] overflow-hidden bg-[hsl(224_32%_7%)]"
      aria-label="Sekcja startowa"
      data-testid="section-hero"
    >
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          key={heroVideoSrc}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop={heroLoop}
          playsInline
          preload="metadata"
          poster="/hero-poster.png"
          data-testid="video-hero"
        >
          <source src={heroVideoSrc} type="video/mp4" />
        </video>
        <div className="hero-overlay absolute inset-0" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-10 sm:px-8 pt-20 md:pt-56">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
          className="noise relative"
        >
          <div className="inline-flex items-center gap-3 rounded-full px-5 py-2 text-white/90 glass-dark">
            <span className="text-sm tracking-wide" data-testid="text-hero-pill">
              <EditableStaticText textKey="hero_pill" defaultValue="Wisła Jawornik · jawornik.eu" />
            </span>
          </div>

          <h1
            className="mt-6 font-display text-4xl leading-[1.03] tracking-[-0.02em] text-white sm:text-6xl"
            data-testid="text-hero-title"
          >
            <EditableStaticText textKey="hero_title" defaultValue="Parafia Ewangelicka w Wiśle Jaworniku" />
          </h1>
          <p
            className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-white/85 sm:text-lg"
            data-testid="text-hero-subtitle"
          >
            <EditableStaticText textKey="hero_subtitle" defaultValue="Aktualności, kalendarz wydarzeń, grupy parafialne, nagrania i galeria — wszystko w jednym miejscu." multiline />
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="rounded-full"
              onClick={() => scrollToId("aktualnosci")}
              data-testid="button-hero-start"
            >
              <EditableStaticText textKey="hero_btn_start" defaultValue="Zobacz aktualności" />
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="rounded-full"
              onClick={() => window.open("https://osrodek.jawornik.eu", "_blank", "noopener,noreferrer")}
              data-testid="button-hero-guesthouse"
            >
              <EditableStaticText textKey="hero_btn_guesthouse" defaultValue="Dom Gościnny" />
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
                <EditableStaticText textKey="hero_btn_play" defaultValue="Odtwórz" />
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
                <EditableStaticText textKey="hero_btn_play" defaultValue="Odtwórz" />
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
            <span className="text-sm" data-testid="text-scroll"><EditableStaticText textKey="hero_scroll" defaultValue="Przewiń" /></span>
            <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" />
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
            <span className="text-white/70">Pętla:</span>
            <button
              onClick={() => saveVideoSetting("hero_video_loop", heroLoop ? "false" : "true")}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${heroLoop ? "bg-green-500/80 text-white" : "bg-white/20 text-white/70 hover:bg-white/30"}`}
              data-testid="button-toggle-loop"
            >
              {heroLoop ? "WŁ" : "WYŁ"}
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
            <span className="text-white/70">Prędkość:</span>
            <div className="flex gap-1" data-testid="controls-speed">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => saveVideoSetting("hero_video_speed", String(s))}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${Math.abs(heroSpeed - s) < 0.01 ? "bg-white text-black" : "bg-white/20 text-white/70 hover:bg-white/30"}`}
                  data-testid={`button-speed-${s}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => videoFileRef.current?.click()}
            className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur transition hover:bg-black/90"
            disabled={videoUploading}
            data-testid="button-upload-hero-video"
          >
            <Video className="h-4 w-4" />
            {videoUploading ? `Wysyłanie… ${uploadProgress}%` : "Zmień wideo"}
          </button>
          <input
            ref={videoFileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoUpload}
            data-testid="input-hero-video"
          />
        </div>
      )}
    </section>
  );
}

const NAV_ITEMS = [
  { id: "aktualnosci", label: "Aktualności" },
  { id: "polecamy", label: "Kalendarz" },
  { id: "grupy", label: "Grupy" },
  { id: "nagrania", label: "Nagrania" },
  { id: "galeria", label: "Galeria" },
  { id: "faq", label: "FAQ" },
  { id: "kontakt", label: "Kontakt" },
] as const;

function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = await login(password);
    if (ok) { onOpenChange(false); setPassword(""); }
    else setError("Nieprawidłowe hasło");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" data-testid="dialog-login-backdrop" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()} data-testid="dialog-login">
        <h3 className="font-display text-xl" data-testid="text-login-title">Panel administracyjny</h3>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="text-login-subtitle">Zaloguj się, aby edytować treści.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            data-testid="input-login-password"
          />
          {error && <p className="text-sm text-red-500" data-testid="text-login-error">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 rounded-xl" data-testid="button-login-submit">
              <LogIn className="mr-2 h-4 w-4" />
              Zaloguj
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} data-testid="button-login-cancel">
              Anuluj
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TopNav({ shown }: { shown: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { isAdmin, isEditMode, setEditMode, logout } = useAuth();

  const desktopBarH = Math.round(CROSS_H_DESKTOP * 0.2752);
  const desktopBarTop = Math.round(CROSS_H_DESKTOP * 0.1632);
  const desktopCrossW = Math.round(CROSS_H_DESKTOP * (53.97 / 87.72));
  const desktopLogoAreaW = desktopCrossW + 12;

  return (
    <>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <nav
        className={cx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-700",
          shown ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
        )}
        data-testid="nav-wrap"
        role="navigation"
        aria-label="Nawigacja główna"
      >
        <div className="md:hidden flex items-center h-14 bg-white/95 backdrop-blur-sm shadow-sm px-4">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 cursor-pointer"
            data-testid="button-nav-logo"
            aria-label="Otwórz menu nawigacyjne"
            aria-expanded={menuOpen}
          >
            <img
              src={PARISH_LOGO_SRC}
              alt="Logo Parafii Ewangelickiej w Wiśle Jaworniku"
              className="h-10 w-auto object-contain"
              loading="eager"
              decoding="async"
              data-testid="img-cross-nav"
            />
            <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Menu</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                data-testid="button-nav-login-mobile"
                aria-label="Zaloguj się"
              >
                <LogIn className="h-4 w-4" />
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setEditMode(!isEditMode)}
                  className={cx(
                    "rounded-lg px-2 py-1 text-xs font-semibold tracking-wide uppercase transition",
                    isEditMode ? "bg-yellow-400 text-yellow-900" : "bg-gray-200 text-gray-600 hover:bg-gray-300",
                  )}
                  data-testid="button-nav-editmode-mobile"
                >
                  <Settings className="mr-1 inline h-3 w-3" />
                  {isEditMode ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100"
                  data-testid="button-nav-logout-mobile"
                  aria-label="Wyloguj"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="absolute inset-x-0 top-0 bg-white" style={{ height: desktopBarTop + desktopBarH + 4 }} />
          <div
            className="absolute right-0"
            style={{ top: desktopBarTop, height: desktopBarH, background: "#b0b0b0", left: desktopLogoAreaW + 3 }}
            data-testid="nav-bar-full"
          />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="absolute left-0 top-0 z-10 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            style={{ width: desktopCrossW, height: CROSS_H_DESKTOP, marginLeft: 3 }}
            data-testid="button-nav-logo-desktop"
            aria-label="Menu"
          >
            <img
              src={PARISH_LOGO_SRC}
              alt="Logo Parafii Ewangelickiej w Wiśle Jaworniku"
              className="h-full w-full object-contain"
              loading="eager"
              decoding="async"
            />
          </button>
          <div
            className="absolute flex items-center gap-8 px-10"
            style={{ top: desktopBarTop, height: desktopBarH, left: desktopLogoAreaW + 3, right: 0 }}
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
                <EditableStaticText textKey={`nav_${item.id}`} defaultValue={item.label} />
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/20 hover:text-white"
                  data-testid="button-nav-login"
                  aria-label="Zaloguj się"
                >
                  <LogIn className="h-4 w-4" />
                </button>
              )}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditMode(!isEditMode)}
                    className={cx(
                      "rounded-lg px-2 py-1 text-xs font-semibold tracking-wide uppercase transition",
                      isEditMode ? "bg-yellow-400 text-yellow-900" : "bg-white/20 text-white hover:bg-white/30",
                    )}
                    data-testid="button-nav-editmode"
                  >
                    <Settings className="mr-1 inline h-3 w-3" />
                    {isEditMode ? "Edycja ON" : "Edycja OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/20 hover:text-white"
                    data-testid="button-nav-logout"
                    aria-label="Wyloguj"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              data-testid="nav-dropdown-backdrop"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 rounded-b-xl bg-white shadow-lg left-0 right-0 top-14 md:left-[3px] md:right-auto md:w-[240px] md:top-[197px]"
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
                    <EditableStaticText textKey={`nav_${item.id}`} defaultValue={item.label} />
                  </button>
                ))}
                <Separator className="my-1" />
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                    className="flex items-center gap-2 px-5 py-3 text-left text-[13px] text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    data-testid="link-dropdown-login"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Zaloguj
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setEditMode(!isEditMode); setMenuOpen(false); }}
                      className="flex items-center gap-2 px-5 py-3 text-left text-[13px] text-gray-500 transition-colors hover:bg-gray-100"
                      data-testid="link-dropdown-editmode"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      {isEditMode ? "Wyłącz edycję" : "Włącz edycję"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="flex items-center gap-2 px-5 py-3 text-left text-[13px] text-gray-400 transition-colors hover:bg-gray-100"
                      data-testid="link-dropdown-logout"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Wyloguj
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </nav>
    </>
  );
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

type FbPost = {
  id: string;
  message: string;
  images: string[];
  created_time: string;
  permalink_url: string;
  reactions_count: number;
  shares_count: number;
  comments_count: number;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? "godzinę" : hrs < 5 ? "godziny" : "godzin"} temu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ${days === 1 ? "dzień" : "dni"} temu`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "tydzień" : weeks < 5 ? "tygodnie" : "tygodni"} temu`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "miesiąc" : months < 5 ? "miesiące" : "miesięcy"} temu`;
}

const CARD_MSG_LEN = 120;

function FbPostModal({ post, open, onClose }: { post: FbPost; open: boolean; onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
      data-testid={`fb-modal-backdrop-${post.id}`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Post z Facebooka"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid={`fb-modal-${post.id}`}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white hover:text-foreground"
          data-testid={`fb-modal-close-${post.id}`}
        >
          <X className="h-4 w-4" />
        </button>

        {post.images.length > 0 && (
          <div className="space-y-1">
            {post.images.map((img, i) => (
              <img key={i} src={img} alt="" className="w-full object-cover" loading="lazy" />
            ))}
          </div>
        )}

        <div className="p-6">
          <div className="mb-3 text-sm text-muted-foreground">{timeAgo(post.created_time)}</div>

          {post.message && (
            <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90" data-testid={`fb-modal-message-${post.id}`}>
              {post.message}
            </p>
          )}

          <div className="mt-5 flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-[#1877F2]" />
              {post.reactions_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              {post.shares_count}
            </span>
            <a
              href={post.permalink_url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto flex items-center gap-1.5 text-sm text-[#1877F2] transition hover:underline"
              data-testid={`fb-modal-link-${post.id}`}
            >
              <Facebook className="h-4 w-4" />
              Zobacz na Facebooku
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function FbPostCard({ post, onSelect }: { post: FbPost; onSelect: () => void }) {
  const needsTruncate = post.message.length > CARD_MSG_LEN;
  const displayMsg = needsTruncate
    ? post.message.slice(0, CARD_MSG_LEN) + "…"
    : post.message;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-white text-left transition-shadow hover:shadow-lg"
      data-testid={`fb-post-${post.id}`}
    >
      {post.images.length > 0 && (
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img
            src={post.images[0]}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 text-xs text-muted-foreground">{timeAgo(post.created_time)}</div>

        {post.message && (
          <p className="mb-3 flex-1 text-sm leading-relaxed text-foreground/90">
            {displayMsg}
          </p>
        )}

        <div className="flex items-center gap-3 border-t pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1" data-testid={`fb-post-reactions-${post.id}`}>
            <ThumbsUp className="h-3 w-3 text-[#1877F2]" />
            {post.reactions_count}
          </span>
          <span className="flex items-center gap-1" data-testid={`fb-post-comments-${post.id}`}>
            <MessageCircle className="h-3 w-3" />
            {post.comments_count}
          </span>
          <span className="flex items-center gap-1" data-testid={`fb-post-shares-${post.id}`}>
            <Share2 className="h-3 w-3" />
            {post.shares_count}
          </span>
        </div>
      </div>
    </button>
  );
}

type FbApiResponse = { error: string | null; posts: FbPost[]; pageSlug?: string };

const FB_PLUGIN_W = 500;
const FB_PLUGIN_H = 800;

function FacebookIframeEmbed({ pageSlug = "wislajawornik" }: { pageSlug?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / FB_PLUGIN_W);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const src =
    `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(`https://www.facebook.com/${pageSlug}`)}` +
    `&tabs=timeline&width=${FB_PLUGIN_W}&height=${FB_PLUGIN_H}&small_header=false&adapt_container_width=false&hide_cover=false&show_facepile=true&locale=pl_PL`;

  return (
    <div
      ref={containerRef}
      className="mt-8 w-full overflow-hidden rounded-2xl"
      style={{ height: FB_PLUGIN_H * scale }}
      data-testid="facebook-embed-iframe"
    >
      <iframe
        src={src}
        width={FB_PLUGIN_W}
        height={FB_PLUGIN_H}
        style={{
          border: "none",
          overflow: "hidden",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        title="Facebook – Parafia Ewangelicka w Wiśle Jaworniku"
      />
    </div>
  );
}

function categorizeFbPosts(posts: FbPost[]) {
  const ogloszenia: FbPost[] = [];
  const wydarzenia: FbPost[] = [];

  for (const p of posts) {
    const msg = (p.message || "").toLowerCase();
    if (msg.startsWith("ogłoszenia parafialne")) {
      ogloszenia.push(p);
    } else if (msg.startsWith("polecamy nagranie")) {
      continue;
    } else {
      wydarzenia.push(p);
    }
  }

  return { ogloszenia, wydarzenia };
}

function FbScrollRow({ title, posts, onSelect }: { title: string; posts: FbPost[]; onSelect: (p: FbPost) => void }) {
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
  }, [posts]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (posts.length === 0) return null;

  return (
    <div className="mt-8" data-testid={`fb-row-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-2xl tracking-tight">{title}</h3>
        <div className="flex gap-1">
          {canScrollLeft && (
            <button onClick={() => scroll(-1)} className="rounded-full border bg-white p-1.5 text-muted-foreground transition hover:bg-muted" aria-label="Przewiń w lewo">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {canScrollRight && (
            <button onClick={() => scroll(1)} className="rounded-full border bg-white p-1.5 text-muted-foreground transition hover:bg-muted" aria-label="Przewiń w prawo">
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
        {posts.map((p) => (
          <div key={p.id} className="w-[280px] flex-shrink-0 snap-start sm:w-[300px]">
            <FbPostCard post={p} onSelect={() => onSelect(p)} />
          </div>
        ))}
      </div>
    </div>
  );
}

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
            <button onClick={() => scroll(-1)} className="rounded-full border bg-white p-1.5 text-muted-foreground transition hover:bg-muted" aria-label="Przewiń w lewo">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {canScrollRight && (
            <button onClick={() => scroll(1)} className="rounded-full border bg-white p-1.5 text-muted-foreground transition hover:bg-muted" aria-label="Przewiń w prawo">
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
            <Card className="overflow-hidden rounded-2xl border bg-white/80 backdrop-blur transition hover:shadow-md">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                  <div className="rounded-full bg-white/90 p-3"><Play className="h-5 w-5 text-red-600" /></div>
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

function RemontModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: imgData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "remont_image"],
    queryFn: () => apiFetch("/api/admin/settings/remont_image"),
  });
  const remontImage = imgData?.value || null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const { url } = await uploadRes.json();
      await apiRequest("PUT", "/api/admin/settings/remont_image", { value: url });
      qc.invalidateQueries({ queryKey: ["admin-setting", "remont_image"] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="remont-modal-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Remont Domu Gościnnego"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="remont-modal"
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white hover:text-foreground"
          data-testid="remont-modal-close"
        >
          <X className="h-4 w-4" />
        </button>

        {remontImage && (
          <img src={remontImage} alt="Remont Domu Gościnnego" className="w-full object-cover max-h-[400px]" data-testid="remont-modal-image" />
        )}

        {isEditMode && (
          <div className="px-6 pt-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1.5 text-xs transition hover:bg-black/20"
              disabled={uploading}
              data-testid="button-upload-remont-image"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "Wysyłanie…" : remontImage ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid="input-remont-image" />
          </div>
        )}

        <div className="p-6">
          <div className="font-display text-2xl tracking-[-0.02em]" data-testid="remont-modal-title">
            <EditableStaticText textKey="afterband_cta_title" defaultValue="Remont Domu Gościnnego" />
          </div>
          <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/80" data-testid="remont-modal-desc">
            <EditableStaticText textKey="remont_description" defaultValue="Tutaj pojawi się opis remontu Domu Gościnnego. Admin może edytować ten tekst w trybie edycji." multiline />
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupModal({ group, open, onClose }: { group: GroupItem; open: boolean; onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { isEditMode } = useAuth();
  const qc = useQueryClient();
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
      await apiRequest("PUT", `/api/groups/${group.id}`, { image_url: url });
      qc.invalidateQueries({ queryKey: ["groups"] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
      data-testid={`group-modal-backdrop-${group.id}`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={group.name}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid={`group-modal-${group.id}`}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-foreground/60 backdrop-blur transition hover:bg-white hover:text-foreground"
          data-testid={`group-modal-close-${group.id}`}
        >
          <X className="h-4 w-4" />
        </button>

        {group.image_url && (
          <img src={group.image_url} alt={group.name} className="w-full object-cover max-h-[400px]" data-testid={`group-modal-image-${group.id}`} />
        )}

        {isEditMode && (
          <div className="px-6 pt-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1.5 text-xs transition hover:bg-black/20"
              disabled={uploading}
              data-testid={`button-upload-group-image-${group.id}`}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {uploading ? "Wysyłanie…" : group.image_url ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid={`input-group-image-${group.id}`} />
          </div>
        )}

        <div className="p-6">
          <div className="font-display text-2xl tracking-[-0.02em]" data-testid={`group-modal-name-${group.id}`}>
            {group.name}
          </div>
          <div className="mt-1 text-sm text-muted-foreground" data-testid={`group-modal-lead-${group.id}`}>
            {group.lead}
          </div>
          <Badge variant="secondary" className="mt-2" data-testid={`group-modal-when-${group.id}`}>
            {group.when_text}
          </Badge>
          <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/80" data-testid={`group-modal-desc-${group.id}`}>
            {group.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function FacebookFeed() {
  const { data, isLoading } = useQuery<FbApiResponse>({
    queryKey: ["facebook-posts"],
    queryFn: () => apiFetch("/api/facebook-posts"),
    refetchInterval: 5 * 60 * 1000,
  });

  const posts = data?.posts ?? [];
  const pageSlug = data?.pageSlug || "wislajawornik";
  const hasNativeFeed = posts.length > 0;
  const [selectedPost, setSelectedPost] = useState<FbPost | null>(null);
  const { ogloszenia, wydarzenia } = categorizeFbPosts(posts);

  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center py-12 text-muted-foreground" data-testid="facebook-loading">
        Ładowanie postów z Facebooka…
      </div>
    );
  }

  if (hasNativeFeed) {
    return (
      <>
        <FbScrollRow title="Wydarzenia" posts={wydarzenia} onSelect={setSelectedPost} />
        <FbScrollRow title="Ogłoszenia parafialne" posts={ogloszenia} onSelect={setSelectedPost} />
        {selectedPost && (
          <FbPostModal post={selectedPost} open={true} onClose={() => setSelectedPost(null)} />
        )}
      </>
    );
  }

  return <FacebookIframeEmbed pageSlug={pageSlug} />;
}

function WeeklyVerseBanner() {
  const { data } = useQuery<{ verse: WeeklyVerseData | null }>({
    queryKey: ["weekly-verse"],
    queryFn: () => apiFetch("/api/weekly-verse"),
    refetchInterval: 60 * 60 * 1000,
  });

  const verse = data?.verse;
  if (!verse?.week_text) return null;

  return (
    <div
      className="w-full bg-[#0a63a3] text-white"
      data-testid="weekly-verse-banner"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2 sm:px-8">
        <BookOpen className="hidden h-4 w-4 shrink-0 opacity-80 sm:block" />
        <p className="text-center text-xs leading-snug sm:text-sm w-full">
          <span className="font-semibold">Hasło tygodnia:</span>{" "}
          <span className="italic">{verse.week_text}</span>
          {verse.week_source && (
            <span className="ml-1 opacity-70">— {verse.week_source}</span>
          )}
        </p>
      </div>
    </div>
  );
}

function EditableText({
  value, field, entityType, entityId, queryKey, multiline = false
}: {
  value: string; field: string; entityType: string; entityId: number; queryKey: string; multiline?: boolean;
}) {
  const { isEditMode } = useAuth();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const qc = useQueryClient();

  useEffect(() => { setText(value); }, [value]);

  const mutation = useMutation({
    mutationFn: async (newVal: string) => {
      await apiRequest("PUT", `/api/${entityType}/${entityId}`, { [field]: newVal });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setEditing(false);
    },
  });

  if (!isEditMode) return <>{value}</>;

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1" data-testid={`editable-${entityType}-${field}-${entityId}`}>
        {multiline ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[60px] text-sm"
            autoFocus
            data-testid={`input-edit-${entityType}-${field}-${entityId}`}
          />
        ) : (
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            data-testid={`input-edit-${entityType}-${field}-${entityId}`}
          />
        )}
        <button
          type="button"
          onClick={() => mutation.mutate(text)}
          className="rounded p-1 text-green-600 hover:bg-green-50"
          data-testid={`button-save-${entityType}-${field}-${entityId}`}
        >
          <Save className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => { setText(value); setEditing(false); }}
          className="rounded p-1 text-red-500 hover:bg-red-50"
          data-testid={`button-cancel-${entityType}-${field}-${entityId}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span
      className="group/edit inline cursor-pointer border-b border-dashed border-transparent hover:border-yellow-400"
      onClick={() => setEditing(true)}
      data-testid={`editable-trigger-${entityType}-${field}-${entityId}`}
    >
      {value}
      <Pencil className="ml-1 inline h-3 w-3 text-yellow-500 opacity-0 group-hover/edit:opacity-100 transition" />
    </span>
  );
}

type SiteTexts = Record<string, string>;

export function EditableStaticText({
  textKey, defaultValue, multiline = false, className = ""
}: {
  textKey: string; defaultValue: string; multiline?: boolean; className?: string;
}) {
  const { isEditMode } = useAuth();
  const { data: siteTexts = {} } = useQuery<SiteTexts>({
    queryKey: ["site-texts"],
    queryFn: () => apiFetch("/api/site-texts"),
  });
  const displayValue = siteTexts[textKey] || defaultValue;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(displayValue);
  const qc = useQueryClient();

  useEffect(() => { setText(siteTexts[textKey] || defaultValue); }, [siteTexts, textKey, defaultValue]);

  const mutation = useMutation({
    mutationFn: async (newVal: string) => {
      await apiRequest("PUT", `/api/site-texts/${textKey}`, { value: newVal });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-texts"] });
      setEditing(false);
    },
  });

  if (!isEditMode) return <span className={className}>{displayValue}</span>;

  if (editing) {
    return (
      <span className={cx("inline-flex items-center gap-1", className)} data-testid={`editable-static-${textKey}`}>
        {multiline ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[60px] text-sm"
            autoFocus
            data-testid={`input-static-${textKey}`}
          />
        ) : (
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            data-testid={`input-static-${textKey}`}
          />
        )}
        <button type="button" onClick={() => mutation.mutate(text)} className="rounded p-1 text-green-600 hover:bg-green-50" data-testid={`button-save-static-${textKey}`}>
          <Save className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => { setText(displayValue); setEditing(false); }} className="rounded p-1 text-red-500 hover:bg-red-50" data-testid={`button-cancel-static-${textKey}`}>
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span
      className={cx("group/edit inline cursor-pointer border-b border-dashed border-transparent hover:border-yellow-400", className)}
      onClick={() => setEditing(true)}
      data-testid={`editable-static-trigger-${textKey}`}
    >
      {displayValue}
      <Pencil className="ml-1 inline h-3 w-3 text-yellow-500 opacity-0 group-hover/edit:opacity-100 transition" />
    </span>
  );
}

function AdminItemActions({ entityType, entityId, queryKey }: { entityType: string; entityId: number; queryKey: string }) {
  const { isEditMode } = useAuth();
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/${entityType}/${entityId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  if (!isEditMode) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm("Czy na pewno chcesz usunąć ten element?")) {
          deleteMutation.mutate();
        }
      }}
      className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
      data-testid={`button-delete-${entityType}-${entityId}`}
      aria-label="Usuń"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function AdminAddButton({ entityType, queryKey, defaultValues, fields }: {
  entityType: string; queryKey: string; defaultValues: Record<string, string>; fields: { key: string; label: string; multiline?: boolean }[];
}) {
  const { isEditMode } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultValues);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await apiRequest("POST", `/api/${entityType}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setOpen(false);
      setFormData(defaultValues);
    },
  });

  if (!isEditMode) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl border-dashed border-yellow-400 text-yellow-600 hover:bg-yellow-50"
        onClick={() => setOpen(true)}
        data-testid={`button-add-${entityType}`}
      >
        <Plus className="mr-1 h-4 w-4" />
        Dodaj
      </Button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)} data-testid={`dialog-add-${entityType}-backdrop`}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()} data-testid={`dialog-add-${entityType}`}>
            <h3 className="font-display text-lg" data-testid={`text-add-${entityType}-title`}>Dodaj nowy element</h3>
            <form
              onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }}
              className="mt-4 space-y-3"
            >
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  {f.multiline ? (
                    <Textarea
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="mt-1"
                      data-testid={`input-add-${entityType}-${f.key}`}
                    />
                  ) : (
                    <Input
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="mt-1"
                      data-testid={`input-add-${entityType}-${f.key}`}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 rounded-xl" data-testid={`button-submit-add-${entityType}`}>
                  <Save className="mr-2 h-4 w-4" />
                  Zapisz
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)} data-testid={`button-cancel-add-${entityType}`}>
                  Anuluj
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function AdminFloatingBar() {
  const { isAdmin, isEditMode, setEditMode } = useAuth();
  if (!isAdmin || !isEditMode) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[90] -translate-x-1/2 rounded-2xl border bg-white/95 px-5 py-3 shadow-xl backdrop-blur" data-testid="admin-floating-bar">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          <span className="text-sm font-semibold text-yellow-700" data-testid="text-editmode-label">Tryb edycji aktywny</span>
        </div>
        <Separator orientation="vertical" className="h-5" />
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => setEditMode(false)}
          data-testid="button-exit-editmode"
        >
          <X className="mr-1 h-4 w-4" />
          Zakończ edycję
        </Button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const stickyShown = useStickyNavTrigger();
  const [remontOpen, setRemontOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);

  const { data: eventsData = [] } = useQuery<EventItem[]>({ queryKey: ["events"], queryFn: () => apiFetch("/api/events") });
  const { data: groupsData = [] } = useQuery<GroupItem[]>({ queryKey: ["groups"], queryFn: () => apiFetch("/api/groups") });
  const { data: recordingsData = [] } = useQuery<RecordingItem[]>({ queryKey: ["recordings"], queryFn: () => apiFetch("/api/recordings") });
  const { data: ytData } = useQuery<YtApiResponse>({ queryKey: ["youtube-videos"], queryFn: () => apiFetch("/api/youtube-videos"), refetchInterval: 30 * 60 * 1000 });
  const ytVideos = ytData?.videos ?? [];
  const { data: faqData = [] } = useQuery<FaqItem[]>({ queryKey: ["faq"], queryFn: () => apiFetch("/api/faq") });
  const { data: contactData = {} } = useQuery<ContactMap>({ queryKey: ["contact"], queryFn: () => apiFetch("/api/contact") });
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

  return (
    <main className="min-h-screen" data-testid="page-home">
      <WeeklyVerseBanner />
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
                <div className="font-display text-xl tracking-[-0.02em]" data-testid="text-afterband-title">
                  <EditableStaticText textKey="afterband_title" defaultValue="Witaj w parafii" />
                </div>
              </div>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap" data-testid="text-afterband-sub">
                <EditableStaticText textKey="afterband_sub" defaultValue="Szybkie skróty do najważniejszych sekcji." multiline />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => scrollToId("polecamy")}
                  data-testid="button-jump-kalendarz"
                >
                  <EditableStaticText textKey="jump_kalendarz" defaultValue="Kalendarz" />
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => scrollToId("nagrania")}
                  data-testid="button-jump-nagrania"
                >
                  <EditableStaticText textKey="jump_nagrania" defaultValue="Nagrania" />
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => scrollToId("kontakt")}
                  data-testid="button-jump-kontakt"
                >
                  <EditableStaticText textKey="jump_kontakt" defaultValue="Kontakt" />
                </Button>
              </div>
            </div>
          </div>
          <div className="md:col-span-5">
            <FeaturedEventPoster />
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

        <FacebookFeed />

        <button
          type="button"
          onClick={() => setRemontOpen(true)}
          className="mt-10 glass rounded-3xl p-5 w-full text-left transition hover:bg-white/80 cursor-pointer"
          data-testid="card-afterband-cta"
        >
          <div className="text-xs text-muted-foreground" data-testid="text-afterband-cta-kicker">
            <EditableStaticText textKey="afterband_cta_kicker" defaultValue="Wyróżnione" />
          </div>
          <div className="mt-2 font-display text-2xl tracking-[-0.02em]" data-testid="text-afterband-cta-title">
            <EditableStaticText textKey="afterband_cta_title" defaultValue="Remont Domu Gościnnego" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground" data-testid="text-afterband-cta-desc">
            <EditableStaticText textKey="afterband_cta_desc" defaultValue="Zobacz informacje i aktualny status prac." />
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            Zobacz więcej
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
        <RemontModal open={remontOpen} onClose={() => setRemontOpen(false)} />
      </section>

      {/* Kalendarz */}
      <section
        id="polecamy"
        className="bg-[linear-gradient(180deg,hsl(214_25%_96%),transparent)]"
        data-testid="section-kalendarz"
      >
        <div id="kalendarz" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
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
            <div className="flex items-center gap-2 bg-blue-600 px-4 py-2.5 text-white">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Kalendarz parafialny</span>
            </div>
            <iframe
              src={googleCalendarSrc}
              className="w-full border-0"
              style={{ height: "600px" }}
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

      {/* Grupy */}
      <section id="grupy" className="mx-auto max-w-6xl px-5 py-16 sm:px-8" data-testid="section-grupy" aria-label="Grupy parafialne">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-groups-title">
              <EditableStaticText textKey="groups_title" defaultValue="Grupy w parafii" />
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-groups-subtitle">
              <EditableStaticText textKey="groups_subtitle" defaultValue="Dołącz do wspólnoty — znajdź przestrzeń dla siebie." />
            </p>
          </div>
          {isEditMode && (
            <AdminAddButton
              entityType="groups"
              queryKey="groups"
              defaultValues={{ name: "", lead: "", when_text: "", description: "" }}
              fields={[
                { key: "name", label: "Nazwa grupy" },
                { key: "lead", label: "Prowadzący" },
                { key: "when_text", label: "Kiedy" },
                { key: "description", label: "Opis", multiline: true },
              ]}
            />
          )}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {groupsData.slice(0, 3).map((g) => (
            <Card
              key={g.id}
              className="rounded-2xl border bg-white/80 p-5 shadow-[0_1px_0_hsl(220_20%_88%/.7)] backdrop-blur cursor-pointer transition hover:bg-white/95 hover:shadow-md"
              onClick={() => setSelectedGroup(g)}
              data-testid={`card-group-${g.id}`}
            >
              {g.image_url && (
                <img src={g.image_url} alt={g.name} className="mb-3 h-32 w-full rounded-xl object-cover" data-testid={`img-group-${g.id}`} />
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-xl" data-testid={`text-group-name-${g.id}`}>
                    <EditableText value={g.name} field="name" entityType="groups" entityId={g.id} queryKey="groups" />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-group-lead-${g.id}`}>
                    <EditableText value={g.lead} field="lead" entityType="groups" entityId={g.id} queryKey="groups" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <AdminItemActions entityType="groups" entityId={g.id} queryKey="groups" />
                  <div className="rounded-xl bg-accent px-2 py-1 text-xs text-accent-foreground" data-testid={`badge-group-when-${g.id}`}>
                    <EditableText value={g.when_text} field="when_text" entityType="groups" entityId={g.id} queryKey="groups" />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80 line-clamp-3" data-testid={`text-group-desc-${g.id}`}>
                <EditableText value={g.description} field="description" entityType="groups" entityId={g.id} queryKey="groups" multiline />
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary" data-testid={`button-group-details-${g.id}`}>
                Zobacz więcej
                <ChevronRight className="h-4 w-4" />
              </span>
            </Card>
          ))}
        </div>
        {selectedGroup && (
          <GroupModal group={selectedGroup} open={true} onClose={() => setSelectedGroup(null)} />
        )}

        <div className="mt-6 text-center">
          <Button variant="outline" className="rounded-xl" asChild data-testid="button-more-groups">
            <Link href="/grupy">
              <EditableStaticText textKey="btn_more_groups" defaultValue="Więcej grup" />
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Nagrania */}
      <section id="nagrania" className="bg-[linear-gradient(180deg,transparent,hsl(214_25%_96%))]" data-testid="section-nagrania" aria-label="Nagrania">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
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
                <a
                  href="https://www.youtube.com/channel/UCYwTmxRhm2hZDWkeEZngc4g"
                  target="_blank"
                  rel="noreferrer"
                >
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
                    <Card className="overflow-hidden rounded-2xl border bg-white/80 backdrop-blur transition hover:shadow-md">
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                          <div className="rounded-full bg-white/90 p-3"><Play className="h-5 w-5 text-red-600" /></div>
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
                  className="group rounded-2xl border bg-white/80 p-5 backdrop-blur"
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

      {/* Galeria */}
      <section id="galeria" className="mx-auto max-w-6xl px-5 py-16 sm:px-8" data-testid="section-galeria" aria-label="Galeria">
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

      {/* FAQ */}
      <section id="faq" className="bg-[linear-gradient(180deg,hsl(214_25%_96%),transparent)]" data-testid="section-faq" aria-label="Najczęściej zadawane pytania">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-faq-title">
                <EditableStaticText textKey="faq_title" defaultValue="FAQ" />
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-faq-subtitle">
                <EditableStaticText textKey="faq_subtitle" defaultValue="Najczęstsze pytania — krótkie odpowiedzi." />
              </p>
            </div>
            {isEditMode && (
              <AdminAddButton
                entityType="faq"
                queryKey="faq"
                defaultValues={{ question: "", answer: "", sort_order: "0" }}
                fields={[
                  { key: "question", label: "Pytanie" },
                  { key: "answer", label: "Odpowiedź", multiline: true },
                  { key: "sort_order", label: "Kolejność" },
                ]}
              />
            )}
          </div>

          <div className="mt-8">
            <Accordion type="single" collapsible className="w-full" data-testid="accordion-faq">
              {faqData.slice(0, 3).map((item, idx) => (
                <AccordionItem key={item.id} value={`i-${item.id}`} data-testid={`faq-item-${idx}`}>
                  <div className="flex items-center">
                    <AccordionTrigger className="flex-1" data-testid={`button-faq-${idx}`}>
                      <EditableText value={item.question} field="question" entityType="faq" entityId={item.id} queryKey="faq" />
                    </AccordionTrigger>
                    <AdminItemActions entityType="faq" entityId={item.id} queryKey="faq" />
                  </div>
                  <AccordionContent data-testid={`text-faq-${idx}`}>
                    <EditableText value={item.answer} field="answer" entityType="faq" entityId={item.id} queryKey="faq" multiline />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-6 text-center">
            <Button variant="outline" className="rounded-xl" asChild data-testid="button-more-faq">
              <Link href="/faq">
                <EditableStaticText textKey="btn_more_faq" defaultValue="Więcej pytań" />
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Dom Gościnny */}
      <section id="dom" className="mx-auto max-w-6xl px-5 py-16 sm:px-8" data-testid="section-dom" aria-label="Dom gościnny">
        <Card className="relative overflow-hidden rounded-3xl border bg-white/80 p-7 backdrop-blur" data-testid="card-guesthouse">
          <div className="absolute inset-0 hero-overlay opacity-35" />
          <div className="relative grid gap-6 md:grid-cols-3 md:items-center">
            <div className="md:col-span-2">
              <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-guesthouse-title">
                <EditableStaticText textKey="guesthouse_title" defaultValue="Dom Gościnny" />
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-guesthouse-subtitle">
                <EditableStaticText textKey="guesthouse_subtitle" defaultValue="Ośrodek wypoczynkowy i miejsce spotkań. Szczegóły, zdjęcia i rezerwacje:" />
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
      <section id="kontakt" className="bg-[linear-gradient(180deg,transparent,hsl(214_25%_96%))]" data-testid="section-kontakt" aria-label="Kontakt">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div>
            <h2 className="font-display text-3xl tracking-[-0.02em]" data-testid="text-contact-title">
              <EditableStaticText textKey="contact_title" defaultValue="Kontakt" />
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground" data-testid="text-contact-subtitle">
              <EditableStaticText textKey="contact_subtitle" defaultValue="Dane kontaktowe parafii." />
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl border bg-white/80 p-6 backdrop-blur" data-testid="card-contact-details">
              <div className="space-y-4">
                <div className="flex items-start gap-3" data-testid="row-contact-address">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium" data-testid="text-contact-address-title"><EditableStaticText textKey="contact_address_label" defaultValue="Adres" /></div>
                    <div className="text-sm text-muted-foreground" data-testid="text-contact-address">
                      <EditableStaticText textKey="contact_address" defaultValue={contactData.address || "(uzupełnij adres)"} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="row-contact-phone">
                  <Phone className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium" data-testid="text-contact-phone-title"><EditableStaticText textKey="contact_phone_label" defaultValue="Telefon" /></div>
                    <div className="text-sm text-muted-foreground" data-testid="text-contact-phone">
                      <EditableStaticText textKey="contact_phone" defaultValue={contactData.phone || "(uzupełnij telefon)"} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3" data-testid="row-contact-mail">
                  <Mail className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium" data-testid="text-contact-mail-title"><EditableStaticText textKey="contact_email_label" defaultValue="E-mail" /></div>
                    <div className="text-sm text-muted-foreground" data-testid="text-contact-mail">
                      <EditableStaticText textKey="contact_email" defaultValue={contactData.email || "(uzupełnij e-mail)"} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3" data-testid="row-contact-hours">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm font-medium" data-testid="text-contact-hours-title"><EditableStaticText textKey="contact_hours_label" defaultValue="Godziny" /></div>
                    <div className="text-sm text-muted-foreground" data-testid="text-contact-hours">
                      <EditableStaticText textKey="contact_hours" defaultValue={contactData.hours || "(uzupełnij godziny)"} />
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
                      href="https://www.youtube.com/channel/UCYwTmxRhm2hZDWkeEZngc4g"
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

            {/* Przelewy24 — ukryta sekcja, gotowa do aktywacji */}
            {isEditMode && (
              <Card className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-6 backdrop-blur lg:col-span-2" data-testid="card-p24-placeholder">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <Heart className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-amber-800" data-testid="text-p24-title">Przelewy24 — Ofiary online</div>
                    <div className="text-xs text-amber-600">Sekcja ukryta dla odwiedzających. Do aktywacji po skonfigurowaniu P24.</div>
                  </div>
                </div>

                <Separator className="my-4 bg-amber-200" />

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3" data-testid="field-p24-amount">
                    <div className="text-xs text-muted-foreground">Kwota</div>
                    <div className="mt-1 text-sm text-amber-700" data-testid="value-p24-amount">50 zł / dowolna kwota</div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3" data-testid="field-p24-title">
                    <div className="text-xs text-muted-foreground">Tytuł wpłaty</div>
                    <div className="mt-1 text-sm text-amber-700" data-testid="value-p24-title">Ofiara na parafię</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-amber-600" data-testid="text-p24-note">
                    Wymaga: klucz P24_MERCHANT_ID + P24_CRC + P24_API_KEY
                  </div>
                  <Button className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white" disabled data-testid="button-p24-pay">
                    Wpłać ofiarę
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-primary/10 shadow-sm" data-testid="map-wrap">
            <div className="bg-gradient-to-r from-primary/5 to-transparent px-5 py-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Znajdź nas na mapie</span>
            </div>
            <iframe
              src="https://www.google.com/maps?q=Parafia+Ewangelicko-Augsburska+Wisła+Jawornik&output=embed"
              className="w-full border-0"
              style={{ height: "350px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa — Parafia Ewangelicka w Wiśle Jaworniku"
              data-testid="iframe-google-map"
            />
          </div>

          <footer className="mt-10 flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between" data-testid="footer">
            <div data-testid="text-footer-left">© {new Date().getFullYear()} <EditableStaticText textKey="footer_text" defaultValue="jawornik.eu" /></div>
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

      <AdminFloatingBar />
    </main>
  );
}
