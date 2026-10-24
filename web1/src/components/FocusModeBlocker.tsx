// FocusModeBlocker.tsx - Add this component to detect blocked sites
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Focus, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusModeBlockerProps {
  isActive: boolean;
  blockedSites: Array<{ url: string; name: string }>;
}

export function FocusModeBlocker({ isActive, blockedSites }: FocusModeBlockerProps) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedSite, setBlockedSite] = useState<string>("");
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    if (!isActive) {
      setIsBlocked(false);
      return;
    }

    // Check if current page URL matches blocked sites
    const checkBlockedSites = () => {
      const currentUrl = window.location.hostname;
      
      const blocked = blockedSites.find(site => 
        currentUrl.includes(site.url.replace('www.', ''))
      );

      if (blocked) {
        setIsBlocked(true);
        setBlockedSite(blocked.name);
      } else {
        setIsBlocked(false);
      }
    };

    checkBlockedSites();

    // Listen for navigation changes (for SPAs)
    const handleNavigation = () => {
      checkBlockedSites();
    };

    window.addEventListener('popstate', handleNavigation);
    
    // Check periodically
    const interval = setInterval(checkBlockedSites, 1000);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      clearInterval(interval);
    };
  }, [isActive, blockedSites]);

  if (!isActive || !isBlocked || !showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full glass-card border-destructive/50 shadow-2xl">
        <div className="p-8 space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 border-2 border-destructive/30 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>

          {/* Message */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Focus Mode Active</h2>
            <p className="text-xl text-muted-foreground">
              You're trying to access <span className="text-destructive font-semibold">{blockedSite}</span>
            </p>
            <p className="text-muted-foreground">
              This site is blocked during your focus session. Stay focused on your goals!
            </p>
          </div>

          {/* Timer Info */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
            <Focus className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-primary">Your focus session is in progress</p>
              <p className="text-sm text-muted-foreground">
                Stay on track to achieve your academic goals
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => window.history.back()}
              className="flex-1 gradient-primary text-primary-foreground border-0 h-12 text-base font-medium"
            >
              Go Back & Stay Focused
            </Button>
            <Button
              onClick={() => setShowWarning(false)}
              variant="outline"
              className="h-12 px-6 border-border/50"
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
          </div>

          {/* Motivation */}
          <div className="pt-4 border-t border-border/30 text-center">
            <p className="text-sm text-muted-foreground italic">
              💡 "Success is the sum of small efforts repeated day in and day out."
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}