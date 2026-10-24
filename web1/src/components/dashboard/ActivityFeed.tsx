import { Bell, BookOpen, Calendar, CheckCircle, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "deadline" | "grade" | "announcement" | "submission" | "schedule";
  title: string;
  description: string;
  time: string;
  isNew?: boolean;
}

const activityIcons = {
  deadline: Calendar,
  grade: CheckCircle,
  announcement: Bell,
  submission: FileText,
  schedule: Clock,
};

const activityStyles = {
  deadline: "bg-destructive/20 text-destructive",
  grade: "bg-success/20 text-success",
  announcement: "bg-primary/20 text-primary",
  submission: "bg-accent/20 text-accent",
  schedule: "bg-muted text-muted-foreground",
};

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type];
        return (
          <div
            key={activity.id}
            className={cn(
              "group relative flex gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-300 hover:border-primary/50",
              "animate-fade-in opacity-0"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {activity.isNew && (
              <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
            
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                activityStyles[activity.type]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium leading-tight">{activity.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground/70">{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
