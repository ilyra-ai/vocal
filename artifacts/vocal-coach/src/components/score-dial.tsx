import { motion } from "framer-motion";

interface ScoreDialProps {
  score: number;
  label: string;
  color?: string;
  size?: number;
}

export function ScoreDial({ score, label, color = "hsl(var(--primary))", size = 120 }: ScoreDialProps) {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color based on score if generic
  const getScoreColor = (s: number) => {
    if (s >= 90) return "hsl(var(--primary))";
    if (s >= 75) return "hsl(var(--chart-2))";
    if (s >= 60) return "hsl(var(--chart-4))";
    return "hsl(var(--destructive))";
  };
  
  const finalColor = color || getScoreColor(score);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={size * 0.08}
            fill="transparent"
            className="text-card-border"
          />
          {/* Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={finalColor}
            strokeWidth={size * 0.08}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="text-2xl font-display font-bold text-white"
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>
      <span className="mt-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}
