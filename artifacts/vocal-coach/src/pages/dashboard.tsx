import { Link } from "wouter";
import { Mic2, Activity, TrendingUp, Music } from "lucide-react";
import { useGetVocalProfile, useListVocalSessions } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: profile, isLoading: isProfileLoading } = useGetVocalProfile();
  const { data: sessions, isLoading: isSessionsLoading } = useListVocalSessions();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Bem-vindo de volta, Artista.</h1>
        <p className="text-muted-foreground text-lg">Pronto para aperfeiçoar sua voz hoje?</p>
      </header>

      {/* Card de Ação Principal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl mb-12 shadow-2xl glow-primary"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Fundo Hero" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        
        <div className="relative z-10 p-10 md:p-14 md:w-2/3">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-6 backdrop-blur-md">
            <Activity className="w-4 h-4 mr-2" />
            Estúdio pronto
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
            Afine sua voz com <br/><span className="text-gradient">Análise por IA</span>
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-lg">
            Grave sua voz e receba feedback instantâneo em nível de PhD sobre entonação, suporte de ar e ressonância.
          </p>
          <Link href="/studio" className="inline-flex items-center px-8 py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95">
            <Mic2 className="w-5 h-5 mr-2" />
            Entrar no Estúdio
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Cartões de Estatísticas */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground font-medium">Precisão de Tom Média</h3>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-display font-bold text-white">
              {isProfileLoading ? "..." : profile?.averagePitchAccuracy ? `${Math.round(profile.averagePitchAccuracy)}%` : "N/A"}
            </div>
            <div className="text-sm text-primary mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+2,4% esta semana</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground font-medium">Total de Sessões</h3>
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Music className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-display font-bold text-white">
              {isProfileLoading ? "..." : profile?.totalSessions || 0}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              A prática leva à perfeição
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground font-medium">Nível Atual</h3>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-display font-bold text-white capitalize">
              {isProfileLoading ? "..." : profile?.skillLevel || "Iniciante"}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Continue evoluindo para o próximo nível
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Sessões Recentes</h2>
          <Link href="/sessions" className="text-primary hover:text-primary/80 font-medium">Ver Todas</Link>
        </div>
        
        {isSessionsLoading ? (
          <div className="text-center py-10 text-muted-foreground">Carregando sessões...</div>
        ) : sessions?.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-white font-medium">Nenhuma sessão ainda</p>
            <p className="text-muted-foreground mb-6">Inicie sua primeira gravação para ver o histórico aqui.</p>
            <Link href="/studio" className="inline-flex px-6 py-3 rounded-xl bg-secondary text-white hover:bg-secondary/80 font-medium transition-colors">
              Criar Sessão
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions?.slice(0, 3).map(session => (
              <Link key={session.id} href={`/sessions/${session.id}`} className="block">
                <div className="glass-panel rounded-2xl p-6 hover:bg-card-border/50 transition-colors group cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 rounded-md bg-secondary text-xs font-medium text-muted-foreground capitalize">
                      {session.genre}
                    </div>
                    {session.overallScore && (
                      <div className="font-display font-bold text-primary">
                        {session.overallScore}%
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{session.title}</h3>
                  {session.targetSong && <p className="text-sm text-muted-foreground mb-4">🎵 {session.targetSong}</p>}
                  
                  <div className="pt-4 border-t border-border mt-auto flex justify-between items-center text-sm text-muted-foreground">
                    <span>{session.recordingCount} gravações</span>
                    <span>{new Date(session.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
