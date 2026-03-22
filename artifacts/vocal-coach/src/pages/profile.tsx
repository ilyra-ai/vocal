import { useGetVocalProfile } from "@workspace/api-client-react";
import { Mic2, Star, TrendingUp, AlertCircle, Music } from "lucide-react";
import { ScoreDial } from "@/components/score-dial";

export default function Profile() {
  const { data: profile, isLoading } = useGetVocalProfile();

  if (isLoading) return <div className="p-8 text-white">Loading profile...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Vocal Profile</h1>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Main Identity */}
        <div className="md:col-span-1 glass-panel rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              {profile?.skillLevel || "Beginner"}
            </span>
          </div>
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-accent p-1 mb-6">
            <div className="w-full h-full rounded-full bg-card overflow-hidden">
              <img src={`${import.meta.env.BASE_URL}images/avatar-placeholder.png`} className="w-full h-full object-cover" alt="Profile" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Vocal Artist</h2>
          <p className="text-primary font-medium mb-6">{profile?.voiceType || "Unidentified Voice Type"}</p>
          
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-6 text-left">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Sessions</p>
              <p className="text-2xl font-display font-bold text-white">{profile?.totalSessions || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Takes</p>
              <p className="text-2xl font-display font-bold text-white">{profile?.totalRecordings || 0}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 grid grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-muted-foreground mb-6">Overall Pitch Accuracy</h3>
            <ScoreDial score={profile?.averagePitchAccuracy || 0} label="All Time" size={160} />
          </div>
          <div className="glass-panel rounded-3xl p-8">
            <h3 className="text-lg font-medium text-muted-foreground mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Trend
            </h3>
            <div className="text-3xl font-display font-bold text-white capitalize mb-4">
              {profile?.progressTrend || "Stable"}
            </div>
            <p className="text-sm text-muted-foreground">Based on your last 5 sessions, your breath support and pitch stability are showing consistent improvement.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-panel rounded-3xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Star className="w-5 h-5 text-accent mr-3" />
            Vocal Strengths
          </h3>
          <ul className="space-y-4">
            {profile?.strengths?.map((strength, i) => (
              <li key={i} className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 mr-3 mt-0.5">
                  <span className="text-xs font-bold">{i+1}</span>
                </div>
                <span className="text-white/90">{strength}</span>
              </li>
            ))}
            {(!profile?.strengths || profile.strengths.length === 0) && (
              <li className="text-muted-foreground italic">Keep practicing to identify strengths.</li>
            )}
          </ul>
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-chart-4 mr-3" />
            Areas to Focus On
          </h3>
          <ul className="space-y-4">
            {profile?.areasToImprove?.map((area, i) => (
              <li key={i} className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-chart-4/20 text-chart-4 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                  <span className="text-xs font-bold">{i+1}</span>
                </div>
                <span className="text-white/90">{area}</span>
              </li>
            ))}
            {(!profile?.areasToImprove || profile.areasToImprove.length === 0) && (
              <li className="text-muted-foreground italic">No major issues identified yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
