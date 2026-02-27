import { eq, asc, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  news, events, groups, recordings, faq, contactInfo, galleries, adminSettings,
  type News, type InsertNews,
  type Event, type InsertEvent,
  type Group, type InsertGroup,
  type Recording, type InsertRecording,
  type Faq, type InsertFaq,
  type ContactInfo, type InsertContactInfo,
  type Gallery, type InsertGallery,
} from "@shared/schema";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      href TEXT
    );
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      place TEXT NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      lead TEXT NOT NULL,
      when_text TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT
    );
    CREATE TABLE IF NOT EXISTS recordings (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      href TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS faq (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS contact_info (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS galleries (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admin_settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export interface IStorage {
  getNews(): Promise<News[]>;
  createNews(item: InsertNews): Promise<News>;
  updateNews(id: number, item: Partial<InsertNews>): Promise<News | null>;
  deleteNews(id: number): Promise<boolean>;
  getEvents(): Promise<Event[]>;
  createEvent(item: InsertEvent): Promise<Event>;
  updateEvent(id: number, item: Partial<InsertEvent>): Promise<Event | null>;
  deleteEvent(id: number): Promise<boolean>;
  getGroups(): Promise<Group[]>;
  createGroup(item: InsertGroup): Promise<Group>;
  updateGroup(id: number, item: Partial<InsertGroup>): Promise<Group | null>;
  deleteGroup(id: number): Promise<boolean>;
  getRecordings(): Promise<Recording[]>;
  createRecording(item: InsertRecording): Promise<Recording>;
  updateRecording(id: number, item: Partial<InsertRecording>): Promise<Recording | null>;
  deleteRecording(id: number): Promise<boolean>;
  getFaq(): Promise<Faq[]>;
  createFaq(item: InsertFaq): Promise<Faq>;
  updateFaq(id: number, item: Partial<InsertFaq>): Promise<Faq | null>;
  deleteFaq(id: number): Promise<boolean>;
  getContactInfo(): Promise<ContactInfo[]>;
  upsertContactInfo(item: InsertContactInfo): Promise<ContactInfo>;
  deleteContactInfo(id: number): Promise<boolean>;
  getGalleries(): Promise<Gallery[]>;
  createGallery(item: InsertGallery): Promise<Gallery>;
  updateGallery(id: number, item: Partial<InsertGallery>): Promise<Gallery | null>;
  deleteGallery(id: number): Promise<boolean>;
  getAdminSetting(key: string): Promise<string | null>;
  setAdminSetting(key: string, value: string): Promise<void>;
  getAllAdminSettings(prefix: string): Promise<{ key: string; value: string }[]>;
}

export class DatabaseStorage implements IStorage {
  async getNews() {
    return db.select().from(news).orderBy(desc(news.date));
  }
  async createNews(item: InsertNews) {
    const [row] = await db.insert(news).values(item).returning();
    return row;
  }
  async updateNews(id: number, item: Partial<InsertNews>) {
    const [row] = await db.update(news).set(item).where(eq(news.id, id)).returning();
    return row ?? null;
  }
  async deleteNews(id: number) {
    const result = await db.delete(news).where(eq(news.id, id)).returning();
    return result.length > 0;
  }

  async getEvents() {
    return db.select().from(events).orderBy(asc(events.date), asc(events.time));
  }
  async createEvent(item: InsertEvent) {
    const [row] = await db.insert(events).values(item).returning();
    return row;
  }
  async updateEvent(id: number, item: Partial<InsertEvent>) {
    const [row] = await db.update(events).set(item).where(eq(events.id, id)).returning();
    return row ?? null;
  }
  async deleteEvent(id: number) {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  async getGroups() {
    return db.select().from(groups).orderBy(asc(groups.name));
  }
  async createGroup(item: InsertGroup) {
    const [row] = await db.insert(groups).values(item).returning();
    return row;
  }
  async updateGroup(id: number, item: Partial<InsertGroup>) {
    const [row] = await db.update(groups).set(item).where(eq(groups.id, id)).returning();
    return row ?? null;
  }
  async deleteGroup(id: number) {
    const result = await db.delete(groups).where(eq(groups.id, id)).returning();
    return result.length > 0;
  }

  async getRecordings() {
    return db.select().from(recordings).orderBy(desc(recordings.date));
  }
  async createRecording(item: InsertRecording) {
    const [row] = await db.insert(recordings).values(item).returning();
    return row;
  }
  async updateRecording(id: number, item: Partial<InsertRecording>) {
    const [row] = await db.update(recordings).set(item).where(eq(recordings.id, id)).returning();
    return row ?? null;
  }
  async deleteRecording(id: number) {
    const result = await db.delete(recordings).where(eq(recordings.id, id)).returning();
    return result.length > 0;
  }

  async getFaq() {
    return db.select().from(faq).orderBy(asc(faq.sort_order));
  }
  async createFaq(item: InsertFaq) {
    const [row] = await db.insert(faq).values(item).returning();
    return row;
  }
  async updateFaq(id: number, item: Partial<InsertFaq>) {
    const [row] = await db.update(faq).set(item).where(eq(faq.id, id)).returning();
    return row ?? null;
  }
  async deleteFaq(id: number) {
    const result = await db.delete(faq).where(eq(faq.id, id)).returning();
    return result.length > 0;
  }

  async getContactInfo() {
    return db.select().from(contactInfo).orderBy(asc(contactInfo.key));
  }
  async upsertContactInfo(item: InsertContactInfo) {
    const [row] = await db
      .insert(contactInfo)
      .values(item)
      .onConflictDoUpdate({ target: contactInfo.key, set: { value: item.value } })
      .returning();
    return row;
  }
  async deleteContactInfo(id: number) {
    const result = await db.delete(contactInfo).where(eq(contactInfo.id, id)).returning();
    return result.length > 0;
  }

  async getGalleries() {
    return db.select().from(galleries).orderBy(asc(galleries.sort_order));
  }
  async createGallery(item: InsertGallery) {
    const [row] = await db.insert(galleries).values(item).returning();
    return row;
  }
  async updateGallery(id: number, item: Partial<InsertGallery>) {
    const [row] = await db.update(galleries).set(item).where(eq(galleries.id, id)).returning();
    return row ?? null;
  }
  async deleteGallery(id: number) {
    const result = await db.delete(galleries).where(eq(galleries.id, id)).returning();
    return result.length > 0;
  }

  async getAdminSetting(key: string) {
    const [row] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return row?.value ?? null;
  }
  async setAdminSetting(key: string, value: string) {
    await db
      .insert(adminSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: adminSettings.key, set: { value } });
  }
  async getAllAdminSettings(prefix: string) {
    const rows = await db.select().from(adminSettings);
    return rows.filter(r => r.key.startsWith(prefix)).map(r => ({ key: r.key, value: r.value }));
  }
}

export const storage = new DatabaseStorage();
