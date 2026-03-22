import { Router, type IRouter } from "express";
import { eq, desc, avg } from "drizzle-orm";
import { z } from "zod";
import { db, vocalSessionsTable, vocalRecordingsTable, vocalProfileTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { analyzePitchData, hzToNoteName } from "./pitch-analysis";
import {
  buildVocalCoachSystemPrompt,
  buildVocalCoachAnalysisPrompt,
} from "./ai-coach";

const router: IRouter = Router();

const createSessionSchema = z.object({
  title: z.string().min(1),
  genre: z.string().min(1),
  targetSong: z.string().nullable().optional(),
  skillLevel: z.string().min(1),
});

const updateProfileSchema = z.object({
  preferredGenres: z.array(z.string()).optional(),
  voiceType: z.string().nullable().optional(),
  skillLevel: z.string().nullable().optional(),
});

const analyzeRecordingSchema = z.object({
  audio: z.string().min(1),
  durationSeconds: z.number().positive(),
  targetNote: z.string().nullable().optional(),
  exerciseType: z.string().nullable().optional(),
  pitchData: z.array(z.object({ t: z.number(), hz: z.number() })).optional(),
});

router.get("/vocal-coach/sessions", async (req, res) => {
  const sessions = await db
    .select()
    .from(vocalSessionsTable)
    .orderBy(desc(vocalSessionsTable.createdAt));
  res.json(sessions);
});

router.post("/vocal-coach/sessions", async (req, res) => {
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { title, genre, targetSong, skillLevel } = parsed.data;
  const [session] = await db
    .insert(vocalSessionsTable)
    .values({ title, genre, targetSong: targetSong ?? null, skillLevel })
    .returning();
  res.status(201).json(session);
});

router.get("/vocal-coach/sessions/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }
  const [session] = await db
    .select()
    .from(vocalSessionsTable)
    .where(eq(vocalSessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const recordings = await db
    .select()
    .from(vocalRecordingsTable)
    .where(eq(vocalRecordingsTable.sessionId, id))
    .orderBy(desc(vocalRecordingsTable.createdAt));

  res.json({
    ...session,
    recordings: recordings.map(deserializeRecording),
  });
});

router.delete("/vocal-coach/sessions/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }
  await db
    .delete(vocalSessionsTable)
    .where(eq(vocalSessionsTable.id, id));
  res.status(204).end();
});

router.get("/vocal-coach/sessions/:id/recordings", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }
  const recordings = await db
    .select()
    .from(vocalRecordingsTable)
    .where(eq(vocalRecordingsTable.sessionId, id))
    .orderBy(desc(vocalRecordingsTable.createdAt));
  res.json(recordings.map(deserializeRecording));
});

router.post("/vocal-coach/sessions/:id/analyze", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }

  const parsed = analyzeRecordingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [session] = await db
    .select()
    .from(vocalSessionsTable)
    .where(eq(vocalSessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const priorRecordings = await db
    .select()
    .from(vocalRecordingsTable)
    .where(eq(vocalRecordingsTable.sessionId, id))
    .orderBy(desc(vocalRecordingsTable.createdAt));

  const { durationSeconds, targetNote, exerciseType, pitchData } = parsed.data;

  const pitchPoints = pitchData ?? [];
  const pitchAnalysis = analyzePitchData(pitchPoints, durationSeconds);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(
    `data: ${JSON.stringify({
      type: "scores",
      data: {
        pitchAccuracyScore: pitchAnalysis.pitchAccuracyScore,
        intonationScore: pitchAnalysis.intonationScore,
        breathSupportScore: pitchAnalysis.breathSupportScore,
        vibratoScore: pitchAnalysis.vibratoScore,
        timingScore: pitchAnalysis.timingScore,
        dominantPitchHz: pitchAnalysis.dominantPitchHz,
        estimatedNote: pitchAnalysis.estimatedNote,
      },
    })}\n\n`,
  );

  const systemPrompt = buildVocalCoachSystemPrompt();
  const userPrompt = buildVocalCoachAnalysisPrompt({
    session,
    pitchAnalysis,
    durationSeconds,
    exerciseType,
    targetNote,
    priorRecordings,
  });

  let fullAnalysis = "";

  const stream = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullAnalysis += content;
      res.write(
        `data: ${JSON.stringify({ type: "content", data: content })}\n\n`,
      );
    }
  }

  const issueLines = extractSection(fullAnalysis, "Technical Issues Identified");
  const recLines = extractSection(fullAnalysis, "Personalized Exercise Protocol");

  const [recording] = await db
    .insert(vocalRecordingsTable)
    .values({
      sessionId: id,
      durationSeconds,
      pitchAccuracyScore: pitchAnalysis.pitchAccuracyScore,
      intonationScore: pitchAnalysis.intonationScore,
      breathSupportScore: pitchAnalysis.breathSupportScore,
      vibratoScore: pitchAnalysis.vibratoScore,
      timingScore: pitchAnalysis.timingScore,
      dominantPitchHz:
        pitchAnalysis.dominantPitchHz > 0
          ? pitchAnalysis.dominantPitchHz
          : null,
      estimatedNote:
        pitchAnalysis.estimatedNote !== "–"
          ? pitchAnalysis.estimatedNote
          : null,
      pitchData: pitchPoints.length > 0 ? JSON.stringify(pitchPoints) : null,
      aiAnalysis: fullAnalysis,
      keyIssues: JSON.stringify(issueLines),
      recommendations: JSON.stringify(recLines),
    })
    .returning();

  const overallScore =
    (pitchAnalysis.pitchAccuracyScore +
      pitchAnalysis.intonationScore +
      pitchAnalysis.breathSupportScore +
      pitchAnalysis.vibratoScore +
      pitchAnalysis.timingScore) /
    5;

  await db
    .update(vocalSessionsTable)
    .set({
      recordingCount: priorRecordings.length + 1,
      overallScore,
      updatedAt: new Date(),
    })
    .where(eq(vocalSessionsTable.id, id));

  await updateVocalProfile(session.genre, pitchAnalysis.pitchAccuracyScore, session.skillLevel, session.voiceType);

  res.write(
    `data: ${JSON.stringify({
      type: "complete",
      data: {
        recordingId: recording.id,
        keyIssues: issueLines,
        recommendations: recLines,
        overallScore,
      },
    })}\n\n`,
  );
  res.end();
});

router.get("/vocal-coach/profile", async (req, res) => {
  let profile = await getOrCreateProfile();
  const sessions = await db.select().from(vocalSessionsTable);
  const recordings = await db.select().from(vocalRecordingsTable);

  const avgScore =
    recordings.length > 0
      ? recordings
          .filter((r) => r.pitchAccuracyScore != null)
          .reduce((sum, r) => sum + (r.pitchAccuracyScore ?? 0), 0) /
        recordings.filter((r) => r.pitchAccuracyScore != null).length
      : null;

  const trend = computeProgressTrend(recordings);

  await db
    .update(vocalProfileTable)
    .set({
      totalSessions: sessions.length,
      totalRecordings: recordings.length,
      averagePitchAccuracy: avgScore,
      progressTrend: trend,
      updatedAt: new Date(),
    })
    .where(eq(vocalProfileTable.id, profile.id));

  const [updated] = await db
    .select()
    .from(vocalProfileTable)
    .where(eq(vocalProfileTable.id, profile.id));

  res.json(deserializeProfile(updated));
});

router.put("/vocal-coach/profile", async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  let profile = await getOrCreateProfile();
  const updates: Partial<typeof vocalProfileTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.preferredGenres !== undefined) {
    updates.preferredGenres = JSON.stringify(parsed.data.preferredGenres);
  }
  if (parsed.data.voiceType !== undefined) {
    updates.voiceType = parsed.data.voiceType ?? null;
  }
  if (parsed.data.skillLevel !== undefined) {
    updates.skillLevel = parsed.data.skillLevel ?? null;
  }

  const [updated] = await db
    .update(vocalProfileTable)
    .set(updates)
    .where(eq(vocalProfileTable.id, profile.id))
    .returning();

  res.json(deserializeProfile(updated));
});

async function getOrCreateProfile() {
  const existing = await db.select().from(vocalProfileTable).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db
    .insert(vocalProfileTable)
    .values({
      preferredGenres: "[]",
      strengths: "[]",
      areasToImprove: "[]",
    })
    .returning();
  return created;
}

async function updateVocalProfile(
  genre: string,
  pitchScore: number,
  skillLevel: string,
  voiceType: string | null,
) {
  let profile = await getOrCreateProfile();

  const genres: string[] = JSON.parse(profile.preferredGenres ?? "[]");
  if (!genres.includes(genre)) genres.push(genre);

  const strengths: string[] = JSON.parse(profile.strengths ?? "[]");
  const areasToImprove: string[] = JSON.parse(profile.areasToImprove ?? "[]");

  if (pitchScore >= 80) {
    if (!strengths.includes("Pitch Accuracy")) strengths.push("Pitch Accuracy");
  } else if (pitchScore < 60) {
    if (!areasToImprove.includes("Pitch Accuracy")) areasToImprove.push("Pitch Accuracy");
  }

  await db
    .update(vocalProfileTable)
    .set({
      preferredGenres: JSON.stringify(genres),
      strengths: JSON.stringify(strengths),
      areasToImprove: JSON.stringify(areasToImprove),
      voiceType: voiceType ?? profile.voiceType,
      skillLevel: skillLevel ?? profile.skillLevel,
      updatedAt: new Date(),
    })
    .where(eq(vocalProfileTable.id, profile.id));
}

function computeProgressTrend(
  recordings: (typeof vocalRecordingsTable.$inferSelect)[],
): string {
  const scored = recordings
    .filter((r) => r.pitchAccuracyScore != null)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  if (scored.length < 4) return "insufficient_data";

  const recent = scored.slice(-5);
  const older = scored.slice(-10, -5);
  if (older.length === 0) return "improving";

  const recentAvg =
    recent.reduce((s, r) => s + (r.pitchAccuracyScore ?? 0), 0) /
    recent.length;
  const olderAvg =
    older.reduce((s, r) => s + (r.pitchAccuracyScore ?? 0), 0) / older.length;

  const diff = recentAvg - olderAvg;
  if (diff > 3) return "improving";
  if (diff < -3) return "declining";
  return "stable";
}

function deserializeRecording(r: typeof vocalRecordingsTable.$inferSelect) {
  return {
    ...r,
    keyIssues: r.keyIssues ? JSON.parse(r.keyIssues) : [],
    recommendations: r.recommendations ? JSON.parse(r.recommendations) : [],
    pitchData: r.pitchData ? JSON.parse(r.pitchData) : null,
  };
}

function deserializeProfile(p: typeof vocalProfileTable.$inferSelect) {
  return {
    ...p,
    preferredGenres: JSON.parse(p.preferredGenres ?? "[]"),
    strengths: JSON.parse(p.strengths ?? "[]"),
    areasToImprove: JSON.parse(p.areasToImprove ?? "[]"),
  };
}

function extractSection(text: string, sectionName: string): string[] {
  const regex = new RegExp(
    `${sectionName}[:\\s]*\\n([\\s\\S]*?)(?=\\n\\d+\\.|\\n##|$)`,
    "i",
  );
  const match = text.match(regex);
  if (!match) return [];

  const lines = match[1]
    .split("\n")
    .map((l) => l.replace(/^\s*[\d\-\*\.]+\s*/, "").trim())
    .filter((l) => l.length > 10);
  return lines.slice(0, 6);
}

export default router;
