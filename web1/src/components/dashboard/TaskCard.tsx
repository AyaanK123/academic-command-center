import { Calendar, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  course: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  estimatedTime?: string;
  progress?: number;
  className?: string;
}

const priorityStyles = {
  high: {
    badge: "bg-destructive/20 text-destructive border-destructive/30",
    indicator: "bg-destructive",
    label: "High Priority",
  },
  medium: {
    badge: "bg-accent/20 text-accent border-accent/30",
    indicator: "bg-accent",
    label: "Medium",
  },
  low: {
    badge: "bg-success/20 text-success border-success/30",
    indicator: "bg-success",
    label: "Low",
  },
};

export function TaskCard({
  title,
  course,
  dueDate,
  priority,
  estimatedTime,
  progress = 0,
  className,
}: TaskCardProps) {
  const priorityConfig = priorityStyles[priority];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:bg-card/80",
        className
      )}
    >
      {/* Priority indicator */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 transition-all duration-300 group-hover:w-1.5",
          priorityConfig.indicator
        )}
      />

      <div className="ml-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h4 className="font-semibold leading-tight">{title}</h4>
            <p className="text-sm text-muted-foreground">{course}</p>
          </div>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
              priorityConfig.badge
            )}
          >
            <Flag className="h-3 w-3" />
            {priorityConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {dueDate}
          </span>
          {estimatedTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {estimatedTime}
            </span>
          )}
        </div>

        {progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
