import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  conversations as conversationsTable,
  messages as messagesTable,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/openai/conversations", async (req, res) => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(asc(conversationsTable.createdAt));
  res.json(conversations);
});

router.post("/openai/conversations", async (req, res) => {
  const schema = z.object({ title: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [conversation] = await db
    .insert(conversationsTable)
    .values({ title: parsed.data.title })
    .returning();
  res.status(201).json(conversation);
});

router.get("/openai/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));
  if (!conversation) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));
  res.json({ ...conversation, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, id));
  res.status(204).end();
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const schema = z.object({ content: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));
  if (!conversation) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const priorMessages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));

  await db
    .insert(messagesTable)
    .values({ conversationId: id, role: "user", content: parsed.data.content });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const chatMessages = [
    {
      role: "system" as const,
      content: `You are Dr. Elena Voce, a world-renowned vocal pedagogy expert with a PhD from the Juilliard School. You have 30 years of experience coaching professional singers across all genres — opera, pop, jazz, musical theatre, rock, R&B, country, and classical. 

You provide expert, clinically precise, personalized advice. You draw on deep knowledge of:
- Vocal physiology and laryngeal mechanics
- Acoustic physics and resonance
- Breath management and sub-glottal pressure
- Pitch, intonation, and register (chest/mix/head/falsetto)
- Style-specific technique for every major genre
- Vocal health, warm-up routines, and injury prevention

When a student asks you a question, respond as a true PhD expert — specific, evidence-based, with named exercises and techniques. Always ask follow-up questions to personalize your guidance.

IMPORTANT: Always respond entirely in Brazilian Portuguese (pt-BR). All your coaching, explanations, exercises and feedback must be written in Portuguese.`,
    },
    ...priorMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: parsed.data.content },
  ];

  let fullResponse = "";

  const stream = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: chatMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  await db
    .insert(messagesTable)
    .values({ conversationId: id, role: "assistant", content: fullResponse });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
