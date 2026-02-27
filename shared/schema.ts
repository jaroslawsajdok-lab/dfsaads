import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  href: text("href"),
});

export const insertNewsSchema = createInsertSchema(news).omit({ id: true });
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  place: text("place").notNull(),
  description: text("description").notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  lead: text("lead").notNull(),
  when_text: text("when_text").notNull(),
  description: text("description").notNull(),
  image_url: text("image_url"),
});

export const insertGroupSchema = createInsertSchema(groups).omit({ id: true });
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  href: text("href").notNull(),
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({ id: true });
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordings.$inferSelect;

export const faq = pgTable("faq", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
});

export const insertFaqSchema = createInsertSchema(faq).omit({ id: true });
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faq.$inferSelect;

export const contactInfo = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertContactInfoSchema = createInsertSchema(contactInfo).omit({ id: true });
export type InsertContactInfo = z.infer<typeof insertContactInfoSchema>;
export type ContactInfo = typeof contactInfo.$inferSelect;

export const galleries = pgTable("galleries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  image_url: text("image_url").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
});

export const insertGallerySchema = createInsertSchema(galleries).omit({ id: true });
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Gallery = typeof galleries.$inferSelect;

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  mime_type: text("mime_type").notNull(),
  data: text("data").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
