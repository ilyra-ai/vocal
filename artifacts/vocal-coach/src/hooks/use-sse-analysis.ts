import { useState, useCallback } from 'react';
import { blobToBase64 } from '@/lib/audio-utils';

export function useSseAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = useCallback(async (sessionId: number, blob: Blob, durationSeconds: number) => {
    setIsAnalyzing(true);
    setAnalysisText("");
    setAnalysisComplete(false);
    setError(null);

    try {
      const base64Audio = await blobToBase64(blob);
      const payload = {
        audio: base64Audio,
        durationSeconds: durationSeconds,
      };

      const response = await fetch(`${import.meta.env.BASE_URL}api/vocal-coach/sessions/${sessionId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) {
                  setAnalysisComplete(true);
                } else if (data.content) {
                  setAnalysisText(prev => prev + data.content);
                } else if (data.type === 'transcript') {
                  setAnalysisText(prev => prev + data.data);
                }
              } catch (e) {
                console.error("Failed to parse SSE data", line, e);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Analysis Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { startAnalysis, isAnalyzing, analysisText, analysisComplete, error };
}
