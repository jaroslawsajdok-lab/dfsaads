export const PARISH_LOGO_SRC = "/parish-cross.svg";
export const CROSS_H_DESKTOP = 450;
export const CROSS_H_MOBILE = 56;

export const DEFAULT_SECTION_ORDER = [
  "aktualnosci", "polecamy", "nagrania", "galeria", "onas", "dom", "kontakt"
];

export const SECTION_LABELS: Record<string, string> = {
  aktualnosci: "Aktualności",
  polecamy: "Kalendarz",
  grupy: "Grupy",
  nagrania: "Nagrania",
  galeria: "Galeria",
  onas: "O nas",
  dom: "Dom Gościnny",
  kontakt: "Kontakt",
};

export type WeeklyVerseData = {
  week_text: string | null;
  week_source: string | null;
  name: string;
  date: string;
};

export type EventItem = {
  id: number;
  date: string;
  time: string;
  type: string;
  title: string;
  place: string;
  description: string;
};

export type GroupItem = {
  id: number;
  name: string;
  lead: string;
  when_text: string;
  description: string;
  image_url: string | null;
};

export type RecordingItem = {
  id: number;
  title: string;
  date: string;
  href: string;
};

export type YtVideo = {
  id: string;
  title: string;
  date: string;
  thumbnail: string;
  channelTitle: string;
};

export type YtApiResponse = { error: string | null; videos: YtVideo[] };

export type FaqItem = {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
};

export type ContactMap = Record<string, string>;

export type FbPost = {
  id: string;
  message: string;
  images: string[];
  created_time: string;
  permalink_url: string;
  reactions_count: number;
  shares_count: number;
  comments_count: number;
};

export type FbApiResponse = { error: string | null; posts: FbPost[]; pageSlug?: string };

export type SiteTexts = Record<string, string>;

export function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function eventTypeColor(type: string) {
  const t = type.toLowerCase();
  if (t.includes("nabożeństwo") || t.includes("nabożeń")) return {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    card: "bg-blue-50/80 border-blue-200/60 dark:bg-blue-900/20 dark:border-blue-700/40",
  };
  if (t.includes("spotkanie")) return {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    card: "bg-amber-50/80 border-amber-200/60 dark:bg-amber-900/20 dark:border-amber-700/40",
  };
  if (t.includes("koncert") || t.includes("muzyk")) return {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    card: "bg-purple-50/80 border-purple-200/60 dark:bg-purple-900/20 dark:border-purple-700/40",
  };
  if (t.includes("konferencja")) return {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    card: "bg-emerald-50/80 border-emerald-200/60 dark:bg-emerald-900/20 dark:border-emerald-700/40",
  };
  return {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    card: "bg-white/75 border-rose-200/40 dark:bg-rose-900/20 dark:border-rose-700/40",
  };
}

export function formatDatePL(isoDate: string) {
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

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerEl = document.querySelector("[data-sticky-nav]") as HTMLElement | null;
  const offset = headerEl ? headerEl.offsetHeight + 8 : 72;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

export async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function timeAgo(iso: string) {
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
