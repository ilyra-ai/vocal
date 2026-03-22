import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Mic, Square, Loader2, Save, X } from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useSseAnalysis } from "@/hooks/use-sse-analysis";
import { useListVocalSessions } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Studio() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSessionId = searchParams.get("sessionId");
  
  const { data: sessions } = useListVocalSessions();
  const [selectedSession, setSelectedSession] = useState<string>(initialSessionId || "");

  const { isRecording, startRecording, stopRecording, audioBlob, canvasRef, currentPitch } = useAudioRecorder();
  const { startAnalysis, isAnalyzing, analysisText, analysisComplete } = useSseAnalysis();

  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleAnalyze = () => {
    if (audioBlob && selectedSession) {
      startAnalysis(parseInt(selectedSession, 10), audioBlob, duration);
    } else if (!selectedSession) {
      alert("Selecione uma sessão antes de analisar.");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Estúdio de Gravação</h1>
        <select 
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="bg-card border border-border text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="" disabled>Selecionar Sessão...</option>
          {sessions?.map(s => (
            <option key={s.id} value={s.id.toString()}>{s.title}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col relative border-card-border/50">
        {/* Área do Visualizador */}
        <div className="flex-1 relative flex flex-col items-center justify-center bg-background/50 p-8 min-h-[300px]">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={250} 
            className="w-full max-w-3xl h-48 rounded-xl opacity-80"
          />
          
          <div className="absolute top-8 left-8">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Tempo</div>
            <div className="text-4xl font-display font-bold text-white font-variant-numeric: tabular-nums">
              {formatTime(duration)}
            </div>
          </div>

          <div className="absolute top-8 right-8 text-right">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Tom</div>
            <div className="text-4xl font-display font-bold text-primary">
              {currentPitch ? currentPitch.note : "--"}
            </div>
            {currentPitch && <div className="text-xs text-muted-foreground">{Math.round(currentPitch.freq)} Hz</div>}
          </div>
        </div>

        {/* Controles */}
        <div className="p-8 border-t border-border bg-card/40 flex justify-center items-center gap-6">
          {!isRecording && !audioBlob && (
            <button 
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform active:scale-95"
            >
              <Mic className="w-8 h-8" />
            </button>
          )}

          {isRecording && (
            <button 
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-secondary text-white flex items-center justify-center border-4 border-destructive hover:bg-secondary/80 animate-pulse"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          )}

          {audioBlob && !isRecording && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-4 rounded-2xl bg-secondary text-white font-medium hover:bg-secondary/80 transition-colors flex items-center"
              >
                <X className="w-5 h-5 mr-2" /> Descartar
              </button>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !selectedSession}
                className="px-8 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all flex items-center disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analisando...</>
                ) : (
                  <><Save className="w-5 h-5 mr-2" /> Analisar e Salvar</>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Painel de Análise */}
      <AnimatePresence>
        {(isAnalyzing || analysisComplete || analysisText) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-8 glass-panel rounded-3xl p-8 border-primary/20"
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4">
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
              </div>
              <h3 className="text-xl font-bold text-white">Análise Vocal por IA</h3>
            </div>
            
            <div className="prose prose-invert max-w-none text-muted-foreground font-mono text-sm whitespace-pre-wrap bg-background/50 p-6 rounded-xl border border-border h-64 overflow-y-auto">
              {analysisText || "Aguardando início da análise..."}
              {isAnalyzing && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />}
            </div>

            {analysisComplete && (
              <div className="mt-6 flex justify-end">
                <a href={`/sessions/${selectedSession}`} className="px-6 py-3 rounded-xl bg-secondary text-white font-medium hover:bg-secondary/80">
                  Ver Resultados Completos
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
