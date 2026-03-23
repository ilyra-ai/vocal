import { useState, useEffect } from "react";
import { Mic, Square, Loader2, Save, X, Plus } from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useSseAnalysis } from "@/hooks/use-sse-analysis";
import { useListVocalSessions, useCreateVocalSession } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Studio() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSessionId = searchParams.get("sessionId");

  const { data: sessions, refetch: refetchSessions } = useListVocalSessions();
  const createSession = useCreateVocalSession();
  const [selectedSession, setSelectedSession] = useState<string>(initialSessionId || "");

  // Modal de nova sessão
  const [showNewSession, setShowNewSession] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", genre: "Pop" });

  const { isRecording, startRecording, stopRecording, audioBlob, canvasRef, currentPitch } = useAudioRecorder();
  const { startAnalysis, isAnalyzing, analysisText, analysisComplete } = useSseAnalysis();
  const [duration, setDuration] = useState(0);

  // Auto-abre o modal se não houver sessões após carregamento
  useEffect(() => {
    if (sessions && sessions.length === 0 && !initialSessionId) {
      setShowNewSession(true);
    }
  }, [sessions, initialSessionId]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const s = await createSession.mutateAsync({
        data: { title: newForm.title, genre: newForm.genre, skillLevel: "Intermediário" },
      });
      await refetchSessions();
      setSelectedSession(s.id.toString());
      setShowNewSession(false);
      setNewForm({ title: "", genre: "Pop" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyze = () => {
    if (audioBlob && selectedSession) {
      startAnalysis(parseInt(selectedSession, 10), audioBlob, duration);
    } else if (!selectedSession) {
      setShowNewSession(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-full flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 md:mb-8 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Estúdio de Gravação</h1>
        <div className="flex items-center gap-2">
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bg-card border border-border text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary max-w-[160px] md:max-w-xs"
          >
            <option value="" disabled>Selecionar Sessão...</option>
            {sessions?.map(s => (
              <option key={s.id} value={s.id.toString()}>{s.title}</option>
            ))}
          </select>
          <button
            onClick={() => setShowNewSession(true)}
            title="Nova sessão"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Alerta: nenhuma sessão selecionada */}
      <AnimatePresence>
        {!selectedSession && !showNewSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex items-center justify-between bg-primary/10 border border-primary/30 rounded-2xl px-5 py-4"
          >
            <p className="text-primary text-sm font-medium">Selecione ou crie uma sessão para salvar sua gravação.</p>
            <button
              onClick={() => setShowNewSession(true)}
              className="ml-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 shrink-0"
            >
              + Nova Sessão
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Painel principal */}
      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col relative border-card-border/50">
        {/* Visualizador */}
        <div className="flex-1 relative flex flex-col items-center justify-center bg-background/50 p-4 md:p-8 min-h-[220px] md:min-h-[300px]">
          <canvas
            ref={canvasRef}
            width={800}
            height={250}
            className="w-full max-w-3xl h-36 md:h-48 rounded-xl opacity-80"
          />

          <div className="absolute top-4 left-4 md:top-8 md:left-8">
            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-0.5 md:mb-1">Tempo</div>
            <div className="text-3xl md:text-4xl font-display font-bold text-white tabular-nums">
              {formatTime(duration)}
            </div>
          </div>

          <div className="absolute top-4 right-4 md:top-8 md:right-8 text-right">
            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-0.5 md:mb-1">Tom</div>
            <div className="text-3xl md:text-4xl font-display font-bold text-primary">
              {currentPitch ? currentPitch.note : "--"}
            </div>
            {currentPitch && <div className="text-xs text-muted-foreground">{Math.round(currentPitch.freq)} Hz</div>}
          </div>
        </div>

        {/* Controles */}
        <div className="p-6 md:p-8 border-t border-border bg-card/40 flex justify-center items-center gap-4 md:gap-6">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform active:scale-95"
            >
              <Mic className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary text-white flex items-center justify-center border-4 border-destructive hover:bg-secondary/80 animate-pulse"
            >
              <Square className="w-5 h-5 md:w-6 md:h-6 fill-current" />
            </button>
          )}

          {audioBlob && !isRecording && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 md:gap-4 flex-wrap justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-3 md:px-6 md:py-4 rounded-2xl bg-secondary text-white font-medium hover:bg-secondary/80 transition-colors flex items-center text-sm md:text-base"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Descartar
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-6 py-3 md:px-8 md:py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all flex items-center disabled:opacity-50 text-sm md:text-base"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" /> Analisando...</>
                ) : (
                  <><Save className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Analisar e Salvar</>
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
            className="mt-6 md:mt-8 glass-panel rounded-3xl p-6 md:p-8 border-primary/20"
          >
            <div className="flex items-center mb-4 md:mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4">
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">Análise Vocal por IA</h3>
            </div>

            <div className="prose prose-invert max-w-none text-muted-foreground font-mono text-xs md:text-sm whitespace-pre-wrap bg-background/50 p-4 md:p-6 rounded-xl border border-border h-48 md:h-64 overflow-y-auto">
              {analysisText || "Aguardando início da análise..."}
              {isAnalyzing && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />}
            </div>

            {analysisComplete && (
              <div className="mt-4 md:mt-6 flex justify-end">
                <a href={`/sessions/${selectedSession}`} className="px-6 py-3 rounded-xl bg-secondary text-white font-medium hover:bg-secondary/80">
                  Ver Resultados Completos
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Nova Sessão */}
      <AnimatePresence>
        {showNewSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-md rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Nova Sessão</h2>
              <p className="text-muted-foreground text-sm mb-6">Crie uma sessão para organizar suas gravações.</p>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Título</label>
                  <input
                    required
                    value={newForm.title}
                    onChange={e => setNewForm({ ...newForm, title: e.target.value })}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="ex.: Prática de Passagem"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Gênero</label>
                  <select
                    value={newForm.genre}
                    onChange={e => setNewForm({ ...newForm, genre: e.target.value })}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {['Pop', 'Clássico', 'Jazz', 'Ópera', 'Rock', 'R&B', 'Teatro Musical', 'MPB', 'Sertanejo', 'Forró'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewSession(false)}
                    className="flex-1 py-3 rounded-xl bg-secondary text-white font-medium hover:bg-secondary/80"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createSession.isPending}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50"
                  >
                    {createSession.isPending ? "Criando..." : "Criar e Selecionar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
