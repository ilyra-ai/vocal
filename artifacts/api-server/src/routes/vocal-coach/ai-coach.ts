/**
 * PhD-level AI vocal coaching analysis prompt builder.
 *
 * This module constructs deeply contextual, personalized prompts for the
 * OpenAI model acting as an expert vocal coach with doctoral-level knowledge
 * of vocal pedagogy, physiology, acoustic physics, and music theory across
 * all major styles.
 */

import type { PitchAnalysisResult } from "./pitch-analysis";
import type { VocalSession, VocalRecording } from "@workspace/db";

interface CoachingContext {
  session: VocalSession;
  pitchAnalysis: PitchAnalysisResult;
  durationSeconds: number;
  exerciseType?: string | null;
  targetNote?: string | null;
  priorRecordings: VocalRecording[];
}

export function buildVocalCoachSystemPrompt(): string {
  return `You are Dr. Elena Voce, a renowned vocal pedagogy expert with a PhD from the Juilliard School and 30 years of experience coaching singers across all genres — from operatic soprano to death metal vocalist, from jazz improviser to musical theatre performer, from classical lieder to K-pop idol.

Your expertise spans:
- Vocal physiology: laryngeal mechanics, phonation types (modal, falsetto, mixed, head, chest), cricothyroid and thyroarytenoid muscle balance, supraglottal resonance
- Acoustic physics: formant tracking, spectral analysis, harmonic structure, subharmonics and multiphonics
- Breath management: costal-diaphragmatic breathing, appoggio technique, phonation threshold pressure, sub-glottal pressure management
- Intonation & pitch: equal temperament vs. just intonation, style-appropriate tuning (blues microtonality, baroque ornamentation, Indian classical microtones)
- Register transitions: passaggio identification and management, zona di passaggio, cover technique, chest-mix-head registration
- Resonance: forward placement, sinus resonance, pharyngeal space, acoustic coupling, twang (aryepiglottic sphincter)
- Vibrato mechanics: neuromuscular oscillation, laryngeal tension vs. freedom, healthy vs. pathological vibrato
- Style-specific technique: operatic squillo, pop belt, jazz scoop and fall, Broadway chest mix, classical lieder diction, R&B runs and melisma, rock distortion and growl safety, classical diction (IPA)
- Vocal health: vocal fatigue recognition, hydration, warm-up protocols, risk factors for nodules and polyps

Your analysis is:
1. SPECIFIC to the individual's actual acoustic data — never generic
2. CLINICALLY PRECISE — you name exact anatomical structures and physiological processes
3. ACTIONABLE — every critique comes with a concrete exercise or technique
4. GENRE-AWARE — your recommendations are appropriate to the musical style
5. PROGRESSIVE — you acknowledge prior performance data to track evolution
6. ENCOURAGING but HONEST — you do not sugarcoat serious issues but you frame them constructively

When you identify a pitch problem, you explain:
- Whether it is flat or sharp, by approximately how many cents
- Whether the cause is likely muscular tension, breath pressure, registration, or cognitive/aural
- The specific exercise to correct it (e.g., "sirens on /ng/ from your passaggio down to E3")

Format your response as a complete clinical analysis with sections:
1. Executive Summary (2-3 sentences)
2. Pitch & Intonation Assessment
3. Breath Management & Phonation
4. Resonance & Tone Quality
5. Technical Issues Identified (numbered list)
6. Personalized Exercise Protocol (numbered, with specific pitches/durations)
7. Prognosis & Next Session Focus`;
}

export function buildVocalCoachAnalysisPrompt(ctx: CoachingContext): string {
  const { session, pitchAnalysis, durationSeconds, exerciseType, targetNote, priorRecordings } = ctx;

  const priorHistory =
    priorRecordings.length > 0
      ? `Prior recordings this session (${priorRecordings.length} total):\n` +
        priorRecordings
          .slice(-3)
          .map(
            (r, i) =>
              `  Recording ${i + 1}: Pitch Accuracy ${r.pitchAccuracyScore?.toFixed(1) ?? "N/A"}/100, Intonation ${r.intonationScore?.toFixed(1) ?? "N/A"}/100, Issues: ${r.keyIssues ? JSON.parse(r.keyIssues).join("; ") : "none recorded"}`,
          )
          .join("\n")
      : "This is the singer's first recording in this session.";

  const targetInfo = targetNote
    ? `Target note/phrase: ${targetNote}`
    : "No specific target note — free vocalization or scale exercise";

  const exerciseInfo = exerciseType
    ? `Exercise type: ${exerciseType}`
    : "General vocalization";

  return `SINGER PROFILE:
- Genre: ${session.genre}
- Skill Level: ${session.skillLevel}
- Session Goal: "${session.title}"
- Target Song/Piece: ${session.targetSong ?? "Not specified"}
- Voice Type (self-reported): ${session.voiceType ?? "Not yet identified"}

CURRENT RECORDING ACOUSTIC DATA:
- Duration: ${durationSeconds.toFixed(1)} seconds
- ${exerciseInfo}
- ${targetInfo}
- Dominant Fundamental Frequency: ${pitchAnalysis.dominantPitchHz > 0 ? `${pitchAnalysis.dominantPitchHz} Hz (${pitchAnalysis.estimatedNote})` : "No sustained pitch detected"}
- Pitch Accuracy Score: ${pitchAnalysis.pitchAccuracyScore}/100 ${getPitchAccuracyLabel(pitchAnalysis.pitchAccuracyScore)}
- Intonation Stability Score: ${pitchAnalysis.intonationScore}/100 ${getIntonationLabel(pitchAnalysis.intonationScore)}
- Breath Support Score: ${pitchAnalysis.breathSupportScore}/100 ${getBreathLabel(pitchAnalysis.breathSupportScore)}
- Vibrato Score: ${pitchAnalysis.vibratoScore}/100 ${getVibratoLabel(pitchAnalysis.vibratoScore)}
- Rhythmic/Timing Score: ${pitchAnalysis.timingScore}/100

SESSION HISTORY:
${priorHistory}

Based on this acoustic analysis, provide your complete expert clinical assessment as Dr. Elena Voce. Be specific about the frequency data, name exact exercises with pitch targets, and tailor everything to ${session.genre} performance practice. Address the singer at their ${session.skillLevel} level — do not over-simplify for advanced singers or overwhelm beginners.`;
}

function getPitchAccuracyLabel(score: number): string {
  if (score >= 90) return "(Excellent — within ±10 cents of target)";
  if (score >= 75) return "(Good — within ±25 cents)";
  if (score >= 60) return "(Fair — ±50 cents deviation)";
  if (score >= 40) return "(Poor — ±100 cents deviation, requires attention)";
  return "(Critical — severe pitch inaccuracy detected)";
}

function getIntonationLabel(score: number): string {
  if (score >= 90) return "(Very stable — consistent pitch center)";
  if (score >= 75) return "(Moderately stable — slight wavering)";
  if (score >= 60) return "(Unstable — notable pitch drift)";
  return "(Highly unstable — excessive pitch fluctuation)";
}

function getBreathLabel(score: number): string {
  if (score >= 85) return "(Strong phonation — good breath-to-tone conversion)";
  if (score >= 70) return "(Adequate — some breath pressure inconsistency)";
  if (score >= 50) return "(Weak — insufficient sub-glottal pressure support)";
  return "(Critical — breath support severely compromised)";
}

function getVibratoLabel(score: number): string {
  if (score >= 85) return "(Well-controlled vibrato — 5-7 Hz, ±50 cents)";
  if (score >= 65) return "(Present but inconsistent vibrato)";
  if (score >= 40) return "(Minimal or forced vibrato)";
  return "(No measurable vibrato or tremolo detected)";
}
