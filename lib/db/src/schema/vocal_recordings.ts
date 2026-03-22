import {
  pgTable,
  serial,
  integer,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vocalSessionsTable } from "./vocal_sessions";

export const vocalRecordingsTable = pgTable("vocal_recordings", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => vocalSessionsTable.id, { onDelete: "cascade" }),
  durationSeconds: real("duration_seconds").notNull(),
  pitchAccuracyScore: real("pitch_accuracy_score"),
  intonationScore: real("intonation_score"),
  breathSupportScore: real("breath_support_score"),
  vibratoScore: real("vibrato_score"),
  timingScore: real("timing_score"),
  dominantPitchHz: real("dominant_pitch_hz"),
  estimatedNote: text("estimated_note"),
  pitchData: text("pitch_data"),
  aiAnalysis: text("ai_analysis"),
  keyIssues: text("key_issues"),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVocalRecordingSchema = createInsertSchema(
  vocalRecordingsTable,
).omit({ id: true, createdAt: true });

export type InsertVocalRecording = z.infer<typeof insertVocalRecordingSchema>;
export type VocalRecording = typeof vocalRecordingsTable.$inferSelect;
