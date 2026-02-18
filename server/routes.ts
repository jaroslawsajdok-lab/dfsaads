import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import {
  insertNewsSchema, insertEventSchema, insertGroupSchema,
  insertRecordingSchema, insertFaqSchema, insertContactInfoSchema,
  insertGallerySchema,
  news, events, groups, recordings, faq, contactInfo, galleries,
} from "@shared/schema";
import { sql } from "drizzle-orm";

const FB_PAGE_ID = "wislajawornik";
const FB_CACHE_TTL = 5 * 60 * 1000;
let fbCache: { data: any; ts: number } | null = null;

async function fetchFacebookPosts() {
  if (fbCache && Date.now() - fbCache.ts < FB_CACHE_TTL) return fbCache.data;

  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!token) return [];

  try {
    const fields = "message,full_picture,created_time,permalink_url,attachments{media,subattachments,media_type,url,title},reactions.summary(true).limit(0),shares,comments.summary(true).limit(0)";
    const url = `https://graph.facebook.com/v21.0/${FB_PAGE_ID}/posts?fields=${encodeURIComponent(fields)}&limit=10&access_token=${token}`;
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
  await storage.createNews({ date: "2026-01-25", title: "Nowe nagrania na YouTube", excerpt: "Dodaliśmy kolejne kazania i materiały. Jeśli nie możesz być na miejscu — odsłuchaj online.", href: "https://www.youtube.com/@parafiae-awisajawornik2251" });

  await storage.createEvent({ date: "2026-02-16", time: "10:00", type: "Nabożeństwo", title: "Nabożeństwo", place: "Kościół — Wisła Jawornik", description: "Wspólne nabożeństwo. Po nabożeństwie kawa i rozmowy." });
  await storage.createEvent({ date: "2026-02-19", time: "18:00", type: "Spotkanie", title: "Spotkanie biblijne", place: "Sala parafialna", description: "Czytanie i rozmowa. Możesz dołączyć w dowolnym momencie." });
  await storage.createEvent({ date: "2026-02-23", time: "17:30", type: "Wydarzenie", title: "Spotkanie informacyjne", place: "Dom parafialny", description: "Aktualności organizacyjne i plany na najbliższy miesiąc." });

  await storage.createGroup({ name: "Chór", lead: "Prowadzący: do ustalenia", when_text: "Środy 18:30", description: "Wspólny śpiew, próby i oprawa muzyczna nabożeństw." });
  await storage.createGroup({ name: "Młodzież", lead: "Prowadzący: do ustalenia", when_text: "Piątki 19:00", description: "Spotkania, rozmowy i inicjatywy młodzieżowe." });
  await storage.createGroup({ name: "Kobiety", lead: "Prowadząca: do ustalenia", when_text: "Co 2 tygodnie", description: "Wzajemne wsparcie, rozmowy i wspólne działania." });

  await storage.createRecording({ title: "Kazanie — Niedziela", date: "2026-02-09", href: "https://www.youtube.com/@parafiae-awisajawornik2251" });
  await storage.createRecording({ title: "Rozważanie tygodnia", date: "2026-02-02", href: "https://www.youtube.com/@parafiae-awisajawornik2251" });
  await storage.createRecording({ title: "Nabożeństwo — zapis", date: "2026-01-25", href: "https://www.youtube.com/@parafiae-awisajawornik2251" });

  await storage.createFaq({ question: "Gdzie znajduje się parafia?", answer: "Parafia znajduje się w Wiśle Jaworniku. Dokładny adres i mapa są w sekcji Kontakt.", sort_order: 0 });
  await storage.createFaq({ question: "Czy mogę dołączyć do grupy w trakcie?", answer: "Tak. W większości przypadków możesz dołączyć w dowolnym momencie — skontaktuj się z prowadzącymi.", sort_order: 1 });
  await storage.createFaq({ question: "Gdzie znajdę nagrania?", answer: "Nagrania publikujemy na YouTube. Link znajduje się w sekcji Nagrania.", sort_order: 2 });

  await storage.upsertContactInfo({ key: "address", value: "Wisła Jawornik (uzupełnij adres)" });
  await storage.upsertContactInfo({ key: "phone", value: "(uzupełnij numer)" });
  await storage.upsertContactInfo({ key: "email", value: "(uzupełnij e-mail)" });
  await storage.upsertContactInfo({ key: "hours", value: "(uzupełnij godziny)" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedIfEmpty();

  app.get("/api/news", async (_req, res) => {
    const data = await storage.getNews();
    res.json(data);
  });

  app.get("/api/events", async (_req, res) => {
    const data = await storage.getEvents();
    res.json(data);
  });

  app.get("/api/groups", async (_req, res) => {
    const data = await storage.getGroups();
    res.json(data);
  });

  app.get("/api/recordings", async (_req, res) => {
    const data = await storage.getRecordings();
    res.json(data);
  });

  app.get("/api/faq", async (_req, res) => {
    const data = await storage.getFaq();
    res.json(data);
  });

  app.get("/api/contact", async (_req, res) => {
    const data = await storage.getContactInfo();
    const map: Record<string, string> = {};
    for (const row of data) map[row.key] = row.value;
    res.json(map);
  });

  app.get("/api/galleries", async (_req, res) => {
    const data = await storage.getGalleries();
    res.json(data);
  });

  app.get("/api/facebook-posts", async (_req, res) => {
    if (!process.env.FACEBOOK_PAGE_TOKEN) {
      res.json({ error: "no_token", posts: [] });
      return;
    }
    const posts = await fetchFacebookPosts();
    res.json({ error: null, posts });
  });

  return httpServer;
}
