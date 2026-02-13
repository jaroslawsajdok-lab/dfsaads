import { eq, asc, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  news, events, groups, recordings, faq, contactInfo, galleries,
  type News, type InsertNews,
  type Event, type InsertEvent,
  type Group, type InsertGroup,
  type Recording, type InsertRecording,
  type Faq, type InsertFaq,
  type ContactInfo, type InsertContactInfo,
  type Gallery, type InsertGallery,
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export interface IStorage {
  getNews(): Promise<News[]>;
  createNews(item: InsertNews): Promise<News>;
  getEvents(): Promise<Event[]>;
  createEvent(item: InsertEvent): Promise<Event>;
  getGroups(): Promise<Group[]>;
  createGroup(item: InsertGroup): Promise<Group>;
  getRecordings(): Promise<Recording[]>;
  createRecording(item: InsertRecording): Promise<Recording>;
  getFaq(): Promise<Faq[]>;
  createFaq(item: InsertFaq): Promise<Faq>;
  getContactInfo(): Promise<ContactInfo[]>;
  upsertContactInfo(item: InsertContactInfo): Promise<ContactInfo>;
  getGalleries(): Promise<Gallery[]>;
  createGallery(item: InsertGallery): Promise<Gallery>;
}

export class DatabaseStorage implements IStorage {
  async getNews() {
    return db.select().from(news).orderBy(desc(news.date));
  }
  async createNews(item: InsertNews) {
    const [row] = await db.insert(news).values(item).returning();
    return row;
  }

  async getEvents() {
    return db.select().from(events).orderBy(asc(events.date), asc(events.time));
  }
  async createEvent(item: InsertEvent) {
    const [row] = await db.insert(events).values(item).returning();
    return row;
  }

  async getGroups() {
    return db.select().from(groups).orderBy(asc(groups.name));
  }
  async createGroup(item: InsertGroup) {
    const [row] = await db.insert(groups).values(item).returning();
    return row;
  }

  async getRecordings() {
    return db.select().from(recordings).orderBy(desc(recordings.date));
  }
  async createRecording(item: InsertRecording) {
    const [row] = await db.insert(recordings).values(item).returning();
    return row;
  }

  async getFaq() {
    return db.select().from(faq).orderBy(asc(faq.sort_order));
  }
  async createFaq(item: InsertFaq) {
    const [row] = await db.insert(faq).values(item).returning();
    return row;
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

  async getGalleries() {
    return db.select().from(galleries).orderBy(asc(galleries.sort_order));
  }
  async createGallery(item: InsertGallery) {
    const [row] = await db.insert(galleries).values(item).returning();
    return row;
  }
}

export const storage = new DatabaseStorage();
