import { useParams, Link } from "wouter";
import { Mic2, ArrowLeft, Trash2, Calendar, FileAudio } from "lucide-react";
import { useGetVocalSession, useDeleteVocalSession } from "@workspace/api-client-react";
import { ScoreDial } from "@/components/score-dial";
import { format } from "date-fns";

export default function SessionDetail() {
  const { id } = useParams();
  const sessionId = parseInt(id || "0", 10);
  
  const { data: session, isLoading } = useGetVocalSession(sessionId);
  const deleteMutation = useDeleteVocalSession();

  if (isLoading) return <div className="p-8 text-white">Loading...</div>;
  if (!session) return <div className="p-8 text-white">Session not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/sessions" className="inline-flex items-center text-muted-foreground hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sessions
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{session.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {format(new Date(session.createdAt), "PPP")}</span>
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">{session.genre}</span>
              {session.targetSong && <span>🎵 {session.targetSong}</span>}
            </div>
          </div>
          <div className="flex gap-3">
            <button className="p-3 rounded-xl bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
            <Link href={`/studio?sessionId=${session.id}`} className="flex items-center px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Mic2 className="w-5 h-5 mr-2" />
              New Recording
            </Link>
          </div>
        </div>
      </div>

      {session.recordings.length === 0 ? (
        <div className="mt-12 text-center glass-panel p-12 rounded-3xl border-dashed">
          <FileAudio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No recordings yet</h3>
          <p className="text-muted-foreground mb-6">Head to the studio to capture your first take for this session.</p>
          <Link href={`/studio?sessionId=${session.id}`} className="inline-flex px-8 py-3 rounded-xl bg-primary text-white font-medium">
            Start Recording
          </Link>
        </div>
      ) : (
        <div className="space-y-8 mt-8">
          {session.recordings.map((rec, index) => (
            <div key={rec.id} className="glass-panel rounded-3xl overflow-hidden border border-card-border p-8">
              <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
                <h3 className="text-2xl font-display font-bold text-white">Take {session.recordings.length - index}</h3>
                <span className="text-muted-foreground text-sm">{format(new Date(rec.createdAt), "p")} • {Math.round(rec.durationSeconds)}s</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
                <ScoreDial score={rec.pitchAccuracyScore || 0} label="Pitch" />
                <ScoreDial score={rec.intonationScore || 0} label="Intonation" />
                <ScoreDial score={rec.breathSupportScore || 0} label="Breath" />
                <ScoreDial score={rec.vibratoScore || 0} label="Vibrato" />
                <ScoreDial score={rec.timingScore || 0} label="Timing" />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                    <span className="w-2 h-6 bg-primary rounded-full mr-3"></span>
                    AI Analysis
                  </h4>
                  <div className="prose prose-invert prose-p:text-muted-foreground max-w-none bg-background/50 rounded-2xl p-6 border border-border">
                    <p>{rec.aiAnalysis || "Analysis pending..."}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {rec.keyIssues && rec.keyIssues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-destructive uppercase tracking-wider mb-3">Key Issues</h4>
                      <ul className="space-y-2">
                        {rec.keyIssues.map((issue, i) => (
                          <li key={i} className="bg-destructive/10 text-destructive-foreground/90 p-3 rounded-lg border border-destructive/20 text-sm">
                            • {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {rec.recommendations && rec.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {rec.recommendations.map((rec, i) => (
                          <li key={i} className="bg-accent/10 text-accent-foreground/90 p-3 rounded-lg border border-accent/20 text-sm">
                            → {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
