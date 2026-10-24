import { BookOpen, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  code: string;
  name: string;
  credits: number;
  instructor: string;
  progress: number;
  nextClass?: string;
  color?: string;
  className?: string;
}

const colorVariants = [
  "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  "from-rose-500/20 to-rose-600/10 border-rose-500/30",
  "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
];

export function CourseCard({
  code,
  name,
  credits,
  instructor,
  progress,
  nextClass,
  className,
}: CourseCardProps) {
  const colorVariant = colorVariants[code.charCodeAt(0) % colorVariants.length];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        colorVariant,
        className
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-block rounded-md bg-background/50 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
              {code}
            </span>
            <h3 className="mt-2 font-semibold leading-tight">{name}</h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {instructor}
          </span>
          <span className="rounded-full bg-background/50 px-2 py-0.5 font-medium">
            {credits} Credits
          </span>
        </div>

        {nextClass && (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3 w-3 text-primary" />
            <span>Next: {nextClass}</span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Course Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background/50">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />
    </div>
  );
}
