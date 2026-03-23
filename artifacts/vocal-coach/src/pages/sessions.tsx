import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Music, Search, X } from "lucide-react";
import { useListVocalSessions, useCreateVocalSession } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Sessions() {
  const [, setLocation] = useLocation();
  const { data: sessions, isLoading, refetch } = useListVocalSessions();
  const createSession = useCreateVocalSession();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ title: "", genre: "Pop", targetSong: "", skillLevel: "Intermediário" });

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions?.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.genre.toLowerCase().includes(q) ||
      (s.targetSong?.toLowerCase().includes(q) ?? false)
    );
  }, [sessions, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newSession = await createSession.mutateAsync({ data: formData });
      setIsDialogOpen(false);
      refetch();
      setLocation(`/sessions/${newSession.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Sessões</h1>
          <p className="text-muted-foreground mt-1">Gerencie e revise seu histórico de prática</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Sessão
        </button>
      </div>

      <div className="glass-panel p-2 rounded-2xl mb-8 flex items-center max-w-md relative">
        <Search className="w-5 h-5 text-muted-foreground ml-3 mr-2 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar sessões..."
          className="bg-transparent border-none outline-none text-white w-full py-2 placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => setSearch("")} className="mr-2 text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Carregando...</div>
      ) : filtered?.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 glass-panel rounded-2xl">
          <Music className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-xl text-white font-medium mb-2">
            {search ? `Nenhum resultado para "${search}"` : "Nenhuma sessão ainda"}
          </p>
          <p className="text-muted-foreground mb-6">
            {search ? "Tente buscar por outro título ou gênero." : "Crie sua primeira sessão para começar a praticar."}
          </p>
          {!search && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Criar Sessão
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered?.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/sessions/${session.id}`} className="block h-full">
                <div className="glass-panel rounded-2xl p-6 h-full flex flex-col hover:border-primary/50 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold capitalize tracking-wide">
                      {session.genre}
                    </span>
                    {session.overallScore && (
                      <span className="bg-background px-2 py-1 rounded text-sm font-bold text-white border border-border">
                        {session.overallScore}%
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{session.title}</h3>
                  {session.targetSong && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-1">🎵 {session.targetSong}</p>
                  )}
                  <div className="mt-auto pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                    <span>{format(new Date(session.createdAt), "d 'de' MMM, yyyy", { locale: ptBR })}</span>
                    <span>{session.recordingCount} gravações</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel w-full max-w-md rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Criar Nova Sessão</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Título da Sessão</label>
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="ex.: Prática de Notas Altas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Gênero</label>
                <select
                  value={formData.genre}
                  onChange={e => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {['Pop', 'Clássico', 'Jazz', 'Ópera', 'Rock', 'R&B', 'Teatro Musical', 'MPB', 'Sertanejo', 'Forró'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Nível de Habilidade</label>
                <select
                  value={formData.skillLevel}
                  onChange={e => setFormData({ ...formData, skillLevel: e.target.value })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {['Iniciante', 'Intermediário', 'Avançado', 'Profissional'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Música-Alvo (Opcional)</label>
                <input
                  value={formData.targetSong}
                  onChange={e => setFormData({ ...formData, targetSong: e.target.value })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="ex.: Evidências – Chitãozinho & Xororó"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-secondary text-white font-medium hover:bg-secondary/80"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSession.isPending}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {createSession.isPending ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
