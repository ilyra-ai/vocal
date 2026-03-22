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

export const vocalProfileTable = pgTable("vocal_profile", {
  id: serial("id").primaryKey(),
  preferredGenres: text("preferred_genres").notNull().default("[]"),
  voiceType: text("voice_type"),
  skillLevel: text("skill_level"),
  totalSessions: integer("total_sessions").notNull().default(0),
  totalRecordings: integer("total_recordings").notNull().default(0),
  averagePitchAccuracy: real("average_pitch_accuracy"),
  progressTrend: text("progress_trend"),
  strengths: text("strengths").notNull().default("[]"),
  areasToImprove: text("areas_to_improve").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVocalProfileSchema = createInsertSchema(vocalProfileTable).omit({
  id: true,
  totalSessions: true,
  totalRecordings: true,
  averagePitchAccuracy: true,
  progressTrend: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVocalProfile = z.infer<typeof insertVocalProfileSchema>;
export type VocalProfile = typeof vocalProfileTable.$inferSelect;
