import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vocalSessionsTable = pgTable("vocal_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  genre: text("genre").notNull(),
  targetSong: text("target_song"),
  voiceType: text("voice_type"),
  skillLevel: text("skill_level").notNull().default("Beginner"),
  recordingCount: integer("recording_count").notNull().default(0),
  overallScore: real("overall_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVocalSessionSchema = createInsertSchema(
  vocalSessionsTable,
).omit({ id: true, recordingCount: true, overallScore: true, createdAt: true, updatedAt: true });

export type InsertVocalSession = z.infer<typeof insertVocalSessionSchema>;
export type VocalSession = typeof vocalSessionsTable.$inferSelect;
