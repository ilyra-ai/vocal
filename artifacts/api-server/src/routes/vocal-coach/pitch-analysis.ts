/**
 * Server-side pitch analysis utilities.
 *
 * We cannot run the full YIN algorithm in Node without a native audio decoder,
 * so we accept the client-supplied pitch data array (computed by the browser
 * Web Audio API) and perform statistical aggregation here:
 * - dominant fundamental frequency (Hz)
 * - closest musical note name (A4 = 440 Hz, equal temperament)
 * - pitch stability (standard-deviation based intonation score)
 * - vibrato detection (periodic oscillation around a central frequency)
 * - overall pitch accuracy (how closely the contour follows the estimated tonic)
 */

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
];

export function hzToNoteName(hz: number): string {
  if (hz <= 0) return "–";
  const semitones = 12 * Math.log2(hz / 440) + 69;
  const rounded = Math.round(semitones);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function centDeviation(hz: number, referenceHz: number): number {
  if (hz <= 0 || referenceHz <= 0) return 0;
  return 1200 * Math.log2(hz / referenceHz);
}

export interface PitchAnalysisResult {
  dominantPitchHz: number;
  estimatedNote: string;
  pitchAccuracyScore: number;
  intonationScore: number;
  vibratoScore: number;
  breathSupportScore: number;
  timingScore: number;
}

/**
 * Analyse an array of pitch data points (time-series of Hz values, 0 = unvoiced).
 *
 * @param pitchPoints  Array of {t: number (seconds), hz: number} pairs
 * @param durationSeconds  Total duration of the recording
 * @param targetNoteHz Optional reference frequency the user was aiming for
 */
export function analyzePitchData(
  pitchPoints: Array<{ t: number; hz: number }>,
  durationSeconds: number,
  targetNoteHz?: number,
): PitchAnalysisResult {
  const voiced = pitchPoints.filter((p) => p.hz > 60 && p.hz < 2000);

  if (voiced.length === 0) {
    return {
      dominantPitchHz: 0,
      estimatedNote: "–",
      pitchAccuracyScore: 0,
      intonationScore: 0,
      vibratoScore: 0,
      breathSupportScore: 0,
      timingScore: 0,
    };
  }

  const voicedRatio = voiced.length / pitchPoints.length;

  const hzValues = voiced.map((p) => p.hz);
  const mean = hzValues.reduce((a, b) => a + b, 0) / hzValues.length;

  const variance =
    hzValues.reduce((sum, hz) => sum + (hz - mean) ** 2, 0) / hzValues.length;
  const stdDev = Math.sqrt(variance);

  const dominantPitchHz = mean;
  const estimatedNote = hzToNoteName(dominantPitchHz);

  const pitchStabilityCents = (stdDev / mean) * 1200;
  const intonationScore = Math.max(
    0,
    Math.min(100, 100 - pitchStabilityCents * 0.8),
  );

  let pitchAccuracyScore: number;
  if (targetNoteHz && targetNoteHz > 0) {
    const deviationCents = Math.abs(centDeviation(mean, targetNoteHz));
    pitchAccuracyScore = Math.max(0, Math.min(100, 100 - deviationCents * 0.5));
  } else {
    pitchAccuracyScore = intonationScore;
  }

  const vibratoScore = detectVibratoScore(voiced);

  const breathSupportScore = Math.min(
    100,
    Math.max(0, voicedRatio * 100 * (intonationScore / 100) * 1.1),
  );

  const timingScore = Math.min(
    100,
    Math.max(0, voicedRatio * 120 - (1 - voicedRatio) * 20),
  );

  return {
    dominantPitchHz: Math.round(dominantPitchHz * 10) / 10,
    estimatedNote,
    pitchAccuracyScore: Math.round(pitchAccuracyScore * 10) / 10,
    intonationScore: Math.round(intonationScore * 10) / 10,
    vibratoScore: Math.round(vibratoScore * 10) / 10,
    breathSupportScore: Math.round(breathSupportScore * 10) / 10,
    timingScore: Math.round(timingScore * 10) / 10,
  };
}

function detectVibratoScore(
  voiced: Array<{ t: number; hz: number }>,
): number {
  if (voiced.length < 20) return 50;

  const hzValues = voiced.map((p) => p.hz);
  const mean = hzValues.reduce((a, b) => a + b, 0) / hzValues.length;

  let zeroCrossings = 0;
  for (let i = 1; i < hzValues.length; i++) {
    const prev = hzValues[i - 1] - mean;
    const curr = hzValues[i] - mean;
    if (prev * curr < 0) zeroCrossings++;
  }

  const totalTime =
    voiced[voiced.length - 1].t - voiced[0].t || 1;
  const oscillationsPerSec = zeroCrossings / 2 / totalTime;

  if (oscillationsPerSec >= 4.5 && oscillationsPerSec <= 8.5) {
    const amplitudes = hzValues.map((hz) => Math.abs(hz - mean));
    const avgAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
    const amplitudeCents = (avgAmplitude / mean) * 1200;
    if (amplitudeCents >= 20 && amplitudeCents <= 100) {
      return Math.min(100, 60 + amplitudeCents);
    }
    return 55;
  }

  if (oscillationsPerSec > 0 && oscillationsPerSec < 4.5) {
    return 30;
  }

  return 40;
}
