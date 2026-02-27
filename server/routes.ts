import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import {
  insertNewsSchema, insertEventSchema, insertGroupSchema,
  insertRecordingSchema, insertFaqSchema, insertContactInfoSchema,
  insertGallerySchema,
  news, events, groups, recordings, faq, contactInfo, galleries,
} from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import multer from "multer";
import path from "path";
import RssParser from "rss-parser";
import fs from "fs";
import crypto from "crypto";
import ical from "node-ical";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

const BNCD_API_KEY = process.env.BNCD_API_KEY || "";
const VERSE_CACHE_TTL = 60 * 60 * 1000;
let verseCache: { data: any; ts: number } | null = null;

async function fetchWeeklyVerse() {
  if (verseCache && Date.now() - verseCache.ts < VERSE_CACHE_TTL) return verseCache.data;

  if (!BNCD_API_KEY) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://biblianacodzien.pl/bncd/api/open-node/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: BNCD_API_KEY }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error("BNCD API error:", res.status);
      return verseCache?.data ?? null;
    }

    const json = await res.json();
    if (json.status !== "ok") {
      console.error("BNCD API status:", json.status, json.error);
      return verseCache?.data ?? null;
    }

    const result = {
      week_text: json.is_week ? json.week : null,
      week_source: json.is_week ? json.week_s : null,
      month_text: json.is_month ? json.month : null,
      month_source: json.is_month ? json.month_s : null,
      year_text: json.is_year ? json.year : null,
      year_source: json.is_year ? json.year_s : null,
      first_text: json.is_first ? json.first : null,
      first_source: json.is_first ? json.first_s : null,
      second_text: json.is_second ? json.second : null,
      second_source: json.is_second ? json.second_s : null,
      name: json.name || "",
      date: json.date || "",
    };

    console.log("BNCD: Fetched weekly verse:", result.week_text?.slice(0, 60));
    verseCache = { data: result, ts: Date.now() };
    return result;
  } catch (err) {
    console.error("BNCD fetch error:", err);
    return verseCache?.data ?? null;
  }
}

const FB_PAGE_SLUG = process.env.FB_PAGE_SLUG || "wislajawornik";
const FB_CACHE_TTL = 5 * 60 * 1000;
let fbCache: { data: any; ts: number } | null = null;
let resolvedPageToken: { pageId: string; token: string; slug: string } | null = null;
let lastKnownFbSlug: string = FB_PAGE_SLUG;

async function resolvePageToken(): Promise<{ pageId: string; token: string; slug: string } | null> {
  if (resolvedPageToken) return resolvedPageToken;

  const userToken = process.env.FACEBOOK_PAGE_TOKEN;
  if (!userToken) return null;

  try {
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,link&access_token=${userToken}`
    );
    if (accountsRes.ok) {
      const accountsJson = await accountsRes.json();
      const pages = accountsJson.data || [];
      if (pages.length > 0) {
        console.log(`FB: Found ${pages.length} page(s): ${pages.map((p: any) => `"${p.name}" (${p.id})`).join(", ")}`);

        const page = pages.length === 1
          ? pages[0]
          : pages.find((p: any) =>
              p.name?.toLowerCase().includes(FB_PAGE_SLUG.toLowerCase()) ||
              p.link?.includes(FB_PAGE_SLUG) ||
              p.id === FB_PAGE_SLUG
            ) || pages[0];

        let slug = FB_PAGE_SLUG;
        try { if (page.link) slug = new URL(page.link).pathname.replace(/\//g, ""); } catch {};

        console.log(`FB: Using page "${page.name}" (ID: ${page.id}, slug: ${slug}) [User Token]`);
        lastKnownFbSlug = slug;
        resolvedPageToken = { pageId: page.id, token: page.access_token, slug };
        return resolvedPageToken;
      }
    }

    console.log("FB: /me/accounts failed or empty, trying as Page Access Token...");
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,link&access_token=${userToken}`
    );
    if (!meRes.ok) {
      console.error("FB /me error:", meRes.status, await meRes.text());
      return null;
    }
    const me = await meRes.json();
    let slug = FB_PAGE_SLUG;
    try { if (me.link) slug = new URL(me.link).pathname.replace(/\//g, ""); } catch {};

    console.log(`FB: Using page "${me.name}" (ID: ${me.id}, slug: ${slug}) [Page Token]`);
    lastKnownFbSlug = slug;
    resolvedPageToken = { pageId: me.id, token: userToken, slug };
    return resolvedPageToken;
  } catch (err) {
    console.error("FB resolvePageToken error:", err);
    return null;
  }
}

// ── YouTube (RSS — no API key required) ──
const YT_CACHE_TTL = 30 * 60 * 1000;
const GCAL_ICAL_URL = "https://calendar.google.com/calendar/ical/peajawornik%40gmail.com/public/basic.ics";
const GCAL_CACHE_TTL = 30 * 60 * 1000;
let gcalCache: { data: any[]; ts: number } | null = null;

function detectEventType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("nabożeństwo") || t.includes("nabożeństwa") || t.includes("msza") || t.includes("liturgi")) return "Nabożeństwo";
  if (t.includes("spotkanie") || t.includes("wieczór") || t.includes("studium")) return "Spotkanie";
  if (t.includes("koncert") || t.includes("muzyk")) return "Koncert";
  if (t.includes("konferencja") || t.includes("zjazd") || t.includes("synod")) return "Konferencja";
  return "Wydarzenie";
}

async function fetchGoogleCalendarEvents(): Promise<any[]> {
  if (gcalCache && Date.now() - gcalCache.ts < GCAL_CACHE_TTL) return gcalCache.data;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(GCAL_ICAL_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`iCal fetch failed: ${response.status}`);
    const icsText = await response.text();

    const parsed = ical.sync.parseICS(icsText);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 90);

    const upcoming: any[] = [];

    for (const key of Object.keys(parsed)) {
      const comp = parsed[key];
      if (comp.type !== "VEVENT") continue;

      if (comp.rrule) {
        try {
          const occurrences = comp.rrule.between(now, rangeEnd, true);
          for (const occ of occurrences) {
            const dt = new Date(occ);
            if (dt >= now) {
              upcoming.push({
                title: comp.summary || "Wydarzenie",
                date: dt.toISOString().slice(0, 10),
                time: dt.toTimeString().slice(0, 5),
                type: detectEventType(comp.summary || ""),
                location: comp.location || "",
              });
            }
          }
        } catch {
          // skip broken rrules
        }
      } else {
        const start = comp.start ? new Date(comp.start) : null;
        if (start && start >= now) {
          upcoming.push({
            title: comp.summary || "Wydarzenie",
            date: start.toISOString().slice(0, 10),
            time: start.toTimeString().slice(0, 5),
            type: detectEventType(comp.summary || ""),
            location: comp.location || "",
          });
        }
      }
    }

    upcoming.sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime());
    const result = upcoming.slice(0, 6);
    gcalCache = { data: result, ts: Date.now() };
    console.log(`Google Calendar: fetched ${upcoming.length} upcoming events, returning ${result.length}`);
    return result;
  } catch (err) {
    console.error("Google Calendar iCal fetch error:", err);
    return gcalCache?.data ?? [];
  }
}

const YT_CHANNEL_ID = "UCYwTmxRhm2hZDWkeEZngc4g";
const YT_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;
let ytCache: { data: any; ts: number } | null = null;
const rssParser = new RssParser();

async function fetchYouTubeVideos(): Promise<any[]> {
  if (ytCache && Date.now() - ytCache.ts < YT_CACHE_TTL) return ytCache.data;

  try {
    const feed = await rssParser.parseURL(YT_RSS_URL);
    const videos = (feed.items || []).slice(0, 40).map((item: any) => {
      const videoId = item.id?.replace("yt:video:", "") || item.link?.split("v=")[1] || "";
      return {
        id: videoId,
        title: item.title || "",
        date: item.pubDate || item.isoDate || "",
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channelTitle: feed.title || "Parafia EA Wisła Jawornik",
      };
    });
    ytCache = { data: videos, ts: Date.now() };
    console.log(`YT RSS: fetched ${videos.length} videos`);
    return videos;
  } catch (err) {
    console.error("YT RSS fetch error:", err);
    return ytCache?.data ?? [];
  }
}

async function fetchFacebookPosts() {
  if (fbCache && Date.now() - fbCache.ts < FB_CACHE_TTL) return fbCache.data;

  const pageInfo = await resolvePageToken();
  if (!pageInfo) return [];

  try {
    const fields = "message,full_picture,created_time,permalink_url,attachments{media,subattachments,media_type,url,title},reactions.summary(true).limit(0),shares,comments.summary(true).limit(0)";
    const url = `https://graph.facebook.com/v21.0/${pageInfo.pageId}/posts?fields=${encodeURIComponent(fields)}&limit=50&access_token=${pageInfo.token}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Facebook API error:", res.status, await res.text());
      return fbCache?.data ?? [];
    }
    const json = await res.json();
    const posts = (json.data || []).map((p: any) => {
      const images: string[] = [];
      if (p.attachments?.data) {
        for (const att of p.attachments.data) {
          if (att.subattachments?.data) {
            for (const sub of att.subattachments.data) {
              if (sub.media?.image?.src) images.push(sub.media.image.src);
            }
          } else if (att.media?.image?.src) {
            images.push(att.media.image.src);
          }
        }
      }
      if (images.length === 0 && p.full_picture) images.push(p.full_picture);

      return {
        id: p.id,
        message: p.message || "",
        images,
        created_time: p.created_time,
        permalink_url: p.permalink_url,
        reactions_count: p.reactions?.summary?.total_count ?? 0,
        shares_count: p.shares?.count ?? 0,
        comments_count: p.comments?.summary?.total_count ?? 0,
      };
    });
    fbCache = { data: posts, ts: Date.now() };
    return posts;
  } catch (err) {
    console.error("Facebook fetch error:", err);
    return fbCache?.data ?? [];
  }
}

async function seedIfEmpty() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(news);
  if (count > 0) return;

  await storage.createNews({ date: "2026-02-09", title: "Nabożeństwo niedzielne — zapraszamy", excerpt: "Spotkajmy się w niedzielę na wspólnej modlitwie i rozmowie. Szczegóły w ogłoszeniach." });
  await storage.createNews({ date: "2026-02-02", title: "Plan spotkań grup w lutym", excerpt: "Zebraliśmy terminy spotkań dla grup parafialnych. Sprawdź kalendarz i dołącz." });
  await storage.createNews({ date: "2026-01-25", title: "Nowe nagrania na YouTube", excerpt: "Dodaliśmy kolejne kazania i materiały. Jeśli nie możesz być na miejscu — odsłuchaj online.", href: "https://www.youtube.com/channel/UCYwTmxRhm2hZDWkeEZngc4g" });

  await storage.createEvent({ date: "2026-02-16", time: "10:00", type: "Nabożeństwo", title: "Nabożeństwo", place: "Kościół — Wisła Jawornik", description: "Wspólne nabożeństwo. Po nabożeństwie kawa i rozmowy." });
  await storage.createEvent({ date: "2026-02-19", time: "18:00", type: "Spotkanie", title: "Spotkanie biblijne", place: "Sala parafialna", description: "Czytanie i rozmowa. Możesz dołączyć w dowolnym momencie." });
  await storage.createEvent({ date: "2026-02-23", time: "17:30", type: "Wydarzenie", title: "Spotkanie informacyjne", place: "Dom parafialny", description: "Aktualności organizacyjne i plany na najbliższy miesiąc." });

  await storage.createGroup({ name: "Chór", lead: "Prowadzący: do ustalenia", when_text: "Środy 18:30", description: "Wspólny śpiew, próby i oprawa muzyczna nabożeństw." });
  await storage.createGroup({ name: "Młodzież", lead: "Prowadzący: do ustalenia", when_text: "Piątki 19:00", description: "Spotkania, rozmowy i inicjatywy młodzieżowe." });
  await storage.createGroup({ name: "Kobiety", lead: "Prowadząca: do ustalenia", when_text: "Co 2 tygodnie", description: "Wzajemne wsparcie, rozmowy i wspólne działania." });

  await storage.createRecording({ title: "Kazanie — Niedziela", date: "2026-02-09", href: "https://www.youtube.com/channel/UCYwTmxRhm2hZDWkeEZngc4g" });
  await storage.createRecording({ title: "Rozważanie tygodnia", date: "2026-02-02", href: "https://www.youtube.com/channel/UCYwTmxRhm2hZDWkeEZngc4g" });
  await storage.createRecording({ title: "Nabożeństwo — zapis", date: "2026-01-25", href: "https://www.youtube.com/channel/UCYwTmxRhm2hZDWkeEZngc4g" });

  await storage.createFaq({ question: "Gdzie znajduje się parafia?", answer: "Parafia znajduje się w Wiśle Jaworniku. Dokładny adres i mapa są w sekcji Kontakt.", sort_order: 0 });
  await storage.createFaq({ question: "Czy mogę dołączyć do grupy w trakcie?", answer: "Tak. W większości przypadków możesz dołączyć w dowolnym momencie — skontaktuj się z prowadzącymi.", sort_order: 1 });
  await storage.createFaq({ question: "Gdzie znajdę nagrania?", answer: "Nagrania publikujemy na YouTube. Link znajduje się w sekcji Nagrania.", sort_order: 2 });

  await storage.upsertContactInfo({ key: "address", value: "Wisła Jawornik (uzupełnij adres)" });
  await storage.upsertContactInfo({ key: "phone", value: "(uzupełnij numer)" });
  await storage.upsertContactInfo({ key: "email", value: "(uzupełnij e-mail)" });
  await storage.upsertContactInfo({ key: "hours", value: "(uzupełnij godziny)" });

  const existingHash = await storage.getAdminSetting("admin_password_hash");
  if (!existingHash) {
    const defaultHash = await bcrypt.hash("admin123", 10);
    await storage.setAdminSetting("admin_password_hash", defaultHash);
  }
}

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(12).toString("hex") + ext;
    cb(null, name);
  },
});
const upload = multer({ storage: uploadStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadVideo = multer({ storage: uploadStorage, limits: { fileSize: 200 * 1024 * 1024 } });

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAdmin) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgSession = connectPgSimple(session);
  app.use(
    session({
      store: new PgSession({ conString: process.env.DATABASE_URL, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" },
    })
  );

  await seedIfEmpty();

  // ── Auth ──
  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Password required" });
    }

    let hash = await storage.getAdminSetting("admin_password_hash");
    if (!hash) {
      hash = await bcrypt.hash(password, 10);
      await storage.setAdminSetting("admin_password_hash", hash);
    }

    const match = await bcrypt.compare(password, hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    req.session.isAdmin = true;
    res.json({ ok: true });
  });

  app.get("/api/admin/session", (req, res) => {
    res.json({ authenticated: !!req.session?.isAdmin });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  // ── Manual verse ──
  app.get("/api/admin/manual-verse", async (_req, res) => {
    const text = await storage.getAdminSetting("manual_verse_text");
    const source = await storage.getAdminSetting("manual_verse_source");
    res.json({ text: text || null, source: source || null });
  });

  app.put("/api/admin/manual-verse", requireAdmin, async (req, res) => {
    const { text, source } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "text required" });
    }
    await storage.setAdminSetting("manual_verse_text", text);
    await storage.setAdminSetting("manual_verse_source", source || "");
    res.json({ ok: true });
  });

  app.delete("/api/admin/manual-verse", requireAdmin, async (_req, res) => {
    await storage.setAdminSetting("manual_verse_text", "");
    await storage.setAdminSetting("manual_verse_source", "");
    res.json({ ok: true });
  });

  // ── Site texts (static editable labels) ──
  app.get("/api/site-texts", async (_req, res) => {
    const allSettings = await storage.getAllAdminSettings("site_text_");
    const map: Record<string, string> = {};
    for (const row of allSettings) {
      map[row.key.replace("site_text_", "")] = row.value;
    }
    res.json(map);
  });

  app.put("/api/site-texts/:key", requireAdmin, async (req, res) => {
    const { value } = req.body;
    if (typeof value !== "string") {
      return res.status(400).json({ message: "value required" });
    }
    await storage.setAdminSetting(`site_text_${req.params.key}`, value);
    res.json({ ok: true });
  });

  app.get("/api/admin/settings/:key", async (req, res) => {
    const value = await storage.getAdminSetting(req.params.key);
    res.json({ value: value || null });
  });

  app.put("/api/admin/settings/:key", requireAdmin, async (req, res) => {
    const { value } = req.body;
    if (typeof value !== "string") {
      return res.status(400).json({ message: "value required" });
    }
    await storage.setAdminSetting(req.params.key, value);
    res.json({ ok: true });
  });

  // ── Upload ──
  app.post("/api/upload", requireAdmin, upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.post("/api/upload-video", requireAdmin, uploadVideo.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const url = `/uploads/${req.file.filename}`;
    await storage.setAdminSetting("hero_video_url", url);
    res.json({ url });
  });

  // ── News ──
  app.get("/api/news", async (_req, res) => {
    res.json(await storage.getNews());
  });
  app.post("/api/news", requireAdmin, async (req, res) => {
    const parsed = insertNewsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.json(await storage.createNews(parsed.data));
  });
  app.put("/api/news/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = insertNewsSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const updated = await storage.updateNews(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });
  app.delete("/api/news/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteNews(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // ── Events ──
  app.get("/api/events", async (_req, res) => {
    res.json(await storage.getEvents());
  });
  app.post("/api/events", requireAdmin, async (req, res) => {
    const parsed = insertEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.json(await storage.createEvent(parsed.data));
  });
  app.put("/api/events/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = insertEventSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const updated = await storage.updateEvent(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });
  app.delete("/api/events/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteEvent(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // ── Groups ──
  app.get("/api/groups", async (_req, res) => {
    res.json(await storage.getGroups());
  });
  app.post("/api/groups", requireAdmin, async (req, res) => {
    const parsed = insertGroupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.json(await storage.createGroup(parsed.data));
  });
  app.put("/api/groups/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = insertGroupSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const updated = await storage.updateGroup(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });
  app.delete("/api/groups/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteGroup(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // ── Recordings ──
  app.get("/api/recordings", async (_req, res) => {
    res.json(await storage.getRecordings());
  });
  app.post("/api/recordings", requireAdmin, async (req, res) => {
    const parsed = insertRecordingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.json(await storage.createRecording(parsed.data));
  });
  app.put("/api/recordings/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = insertRecordingSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const updated = await storage.updateRecording(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });
  app.delete("/api/recordings/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteRecording(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // ── FAQ ──
  app.get("/api/faq", async (_req, res) => {
    res.json(await storage.getFaq());
  });
  app.post("/api/faq", requireAdmin, async (req, res) => {
    const parsed = insertFaqSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.json(await storage.createFaq(parsed.data));
  });
  app.put("/api/faq/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = insertFaqSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const updated = await storage.updateFaq(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });
  app.delete("/api/faq/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteFaq(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // ── Contact ──
  app.get("/api/contact", async (_req, res) => {
    const data = await storage.getContactInfo();
    const map: Record<string, string> = {};
    for (const row of data) map[row.key] = row.value;
    res.json(map);
  });
  app.post("/api/contact", requireAdmin, async (req, res) => {
    const parsed = insertContactInfoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.json(await storage.upsertContactInfo(parsed.data));
  });
  app.put("/api/contact/:key", requireAdmin, async (req, res) => {
    const { value } = req.body;
    if (!value || typeof value !== "string") {
      return res.status(400).json({ message: "value required" });
    }
    const result = await storage.upsertContactInfo({ key: req.params.key as string, value });
    res.json(result);
  });
  app.delete("/api/contact/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteContactInfo(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // ── Galleries ──
  app.get("/api/galleries", async (_req, res) => {
    res.json(await storage.getGalleries());
  });
  app.post("/api/galleries", requireAdmin, async (req, res) => {
    const parsed = insertGallerySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    res.json(await storage.createGallery(parsed.data));
  });
  app.put("/api/galleries/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = insertGallerySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const updated = await storage.updateGallery(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });
  app.delete("/api/galleries/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteGallery(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // ── Weekly verse (with manual override) ──
  app.get("/api/weekly-verse", async (_req, res) => {
    const manualText = await storage.getAdminSetting("manual_verse_text");
    if (manualText) {
      const manualSource = await storage.getAdminSetting("manual_verse_source");
      return res.json({
        verse: {
          week_text: manualText,
          week_source: manualSource || "",
          month_text: null, month_source: null,
          year_text: null, year_source: null,
          first_text: null, first_source: null,
          second_text: null, second_source: null,
          name: "Ręczny wpis", date: "",
          manual: true,
        },
      });
    }
    const verse = await fetchWeeklyVerse();
    res.json({ verse });
  });

  // ── Facebook ──
  app.get("/api/facebook-posts", async (_req, res) => {
    if (!process.env.FACEBOOK_PAGE_TOKEN) {
      res.json({ error: "no_token", posts: [], pageSlug: lastKnownFbSlug });
      return;
    }
    const posts = await fetchFacebookPosts();
    const slug = resolvedPageToken?.slug || lastKnownFbSlug;
    res.json({ error: null, posts, pageSlug: slug });
  });

  // ── YouTube (RSS feed, no API key needed) ──
  app.get("/api/youtube-videos", async (_req, res) => {
    const videos = await fetchYouTubeVideos();
    res.json({ error: null, videos });
  });

  // ── Google Calendar events (iCal feed) ──
  app.get("/api/calendar-events", async (_req, res) => {
    const events = await fetchGoogleCalendarEvents();
    res.json({ error: null, events });
  });

  return httpServer;
}
