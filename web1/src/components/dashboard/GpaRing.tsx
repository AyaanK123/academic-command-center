import { cn } from "@/lib/utils";

interface GpaRingProps {
  value: number;
  maxValue?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { dimension: 80, strokeWidth: 6, fontSize: "text-lg" },
  md: { dimension: 120, strokeWidth: 8, fontSize: "text-2xl" },
  lg: { dimension: 180, strokeWidth: 10, fontSize: "text-4xl" },
};

export function GpaRing({
  value,
  maxValue = 10,
  size = "md",
  label,
  showValue = true,
  className,
}: GpaRingProps) {
  const config = sizeConfig[size];
  const radius = (config.dimension - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = (value / maxValue) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getGradientColor = () => {
    if (percentage >= 80) return "url(#gradient-success)";
    if (percentage >= 60) return "url(#gradient-primary)";
    if (percentage >= 40) return "url(#gradient-warning)";
    return "url(#gradient-danger)";
  };

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        width={config.dimension}
        height={config.dimension}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(142, 76%, 45%)" />
            <stop offset="100%" stopColor="hsl(160, 84%, 40%)" />
          </linearGradient>
          <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
            <stop offset="100%" stopColor="hsl(250, 91%, 65%)" />
          </linearGradient>
          <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(38, 92%, 50%)" />
            <stop offset="100%" stopColor="hsl(25, 95%, 55%)" />
          </linearGradient>
          <linearGradient id="gradient-danger" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 84%, 60%)" />
            <stop offset="100%" stopColor="hsl(0, 84%, 50%)" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={config.strokeWidth}
          className="opacity-30"
        />

        {/* Progress circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          stroke={getGradientColor()}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))",
          }}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", config.fontSize)}>{value.toFixed(2)}</span>
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
