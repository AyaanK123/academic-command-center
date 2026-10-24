import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Focus, 
  Timer, 
  Bell, 
  Globe, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus,
  Trash2,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Info
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FocusSession {
  id: string;
  duration: number;
  category: string;
  startTime: number;
  endTime?: number;
  completed: boolean;
}

interface BlockedSite {
  id: string;
  url: string;
  name: string;
}

export default function FocusMode() {
  const { toast } = useToast();
  
  // Timer State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [focusCategory, setFocusCategory] = useState("Study");
  
  // Focus Settings
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoBreak, setAutoBreak] = useState(true);
  
  // Website Blocking
  const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([
    { id: "1", url: "youtube.com", name: "YouTube" },
    { id: "2", url: "facebook.com", name: "Facebook" },
    { id: "3", url: "instagram.com", name: "Instagram" },
    { id: "4", url: "twitter.com", name: "Twitter/X" },
  ]);
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [isAddSiteDialogOpen, setIsAddSiteDialogOpen] = useState(false);
  
  // Session History
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Save blocked sites to localStorage for extension sync
  useEffect(() => {
    localStorage.setItem('focusMode-blockedSites', JSON.stringify(blockedSites));
    localStorage.setItem('focusMode-active', JSON.stringify(isActive));
  }, [blockedSites, isActive]);

  // Timer logic
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleTimerComplete = () => {
    setIsActive(false);
    setIsPaused(false);
    
    if (soundEnabled && audioRef.current) {
      audioRef.current.play();
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Session Complete! 🎉', {
        body: `Great job! You completed ${selectedDuration} minutes of focused work.`,
        icon: '/favicon.ico',
      });
    }
    
    const newSession: FocusSession = {
      id: Date.now().toString(),
      duration: selectedDuration,
      category: focusCategory,
      startTime: Date.now() - (selectedDuration * 60 * 1000),
      endTime: Date.now(),
      completed: true,
    };
    
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    localStorage.setItem('focus-sessions', JSON.stringify(updatedSessions));
    
    updateStats(updatedSessions);
    
    toast({
      title: "Focus Session Complete! 🎉",
      description: `You focused for ${selectedDuration} minutes. Great work!`,
    });
    
    if (autoBreak) {
      setTimeout(() => {
        toast({
          title: "Time for a break! ☕",
          description: "Take a 5-minute break before your next session.",
        });
      }, 1000);
    }
    
    setTimeLeft(selectedDuration * 60);
  };

  const startTimer = () => {
    if (!isActive) {
      if (fullscreenMode && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log('Fullscreen not supported:', err);
        });
      }
      
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      toast({
        title: "Focus Mode Activated! 🎯",
        description: `Starting ${selectedDuration}-minute focus session`,
      });
    }
    
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(selectedDuration * 60);
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const updateStats = (sessionsList: FocusSession[]) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const todayMins = sessionsList
      .filter(s => s.completed && s.startTime >= today)
      .reduce((sum, s) => sum + s.duration, 0);
    
    const weekMins = sessionsList
      .filter(s => s.completed && s.startTime >= weekAgo.getTime())
      .reduce((sum, s) => sum + s.duration, 0);
    
    setTodayMinutes(todayMins);
    setWeekMinutes(weekMins);
    
    const sortedSessions = sessionsList
      .filter(s => s.completed)
      .sort((a, b) => b.startTime - a.startTime);
    
    let streak = 0;
    let currentDay = new Date().setHours(0, 0, 0, 0);
    
    for (const session of sortedSessions) {
      const sessionDay = new Date(session.startTime).setHours(0, 0, 0, 0);
      if (sessionDay === currentDay) {
        streak++;
        currentDay -= 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }
    
    setCurrentStreak(streak);
  };

  const addBlockedSite = () => {
    if (!newSiteUrl || !newSiteName) {
      toast({
        title: "Missing Information",
        description: "Please enter both URL and name",
        variant: "destructive",
      });
      return;
    }
    
    const newSite: BlockedSite = {
      id: Date.now().toString(),
      url: newSiteUrl,
      name: newSiteName,
    };
    
    setBlockedSites([...blockedSites, newSite]);
    setNewSiteUrl("");
    setNewSiteName("");
    setIsAddSiteDialogOpen(false);
    
    toast({
      title: "Site Blocked",
      description: `${newSiteName} will be blocked during focus sessions`,
    });
  };

  const removeBlockedSite = (id: string) => {
    setBlockedSites(blockedSites.filter(s => s.id !== id));
    toast({
      title: "Site Unblocked",
      description: "Site removed from block list",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

  const stats = [
    { 
      label: "Today", 
      value: `${todayMinutes}m`, 
      icon: Clock, 
      gradient: "gradient-primary",
      description: "Focused time"
    },
    { 
      label: "This Week", 
      value: `${Math.round(weekMinutes / 60)}h`, 
      icon: TrendingUp, 
      gradient: "gradient-accent",
      description: "Total hours"
    },
    { 
      label: "Streak", 
      value: `${currentStreak}d`, 
      icon: Zap, 
      gradient: "gradient-success",
      description: "Consecutive days"
    },
    { 
      label: "Sessions", 
      value: sessions.filter(s => s.completed).length.toString(), 
      icon: CheckCircle2, 
      gradient: "gradient-primary",
      description: "Completed"
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <audio ref={audioRef} src="/notification.mp3" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3 text-gradient-primary">
              Focus Mode
            </h1>
            <p className="text-muted-foreground text-lg">
              Eliminate distractions and maximize productivity
            </p>
          </div>

          {/* Extension Info Banner */}
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-blue-700 dark:text-blue-300">Browser Extension Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                For real website blocking, make sure the <strong>Focus Mode Blocker</strong> extension is installed and enabled in your browser. 
                The extension is located in the <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">browser-extension</code> folder.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-4 mb-10">
            {stats.map((stat) => (
              <Card key={stat.label} className="glass-card-hover border-border/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.gradient)}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Timer Card */}
            <div className="lg:col-span-2">
              <Card className="glass-card border-border/30">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                      <Timer className="h-5 w-5 text-primary-foreground" />
                    </div>
                    Focus Timer
                  </CardTitle>
                  <CardDescription>
                    Use the Pomodoro technique to stay focused
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Timer Display */}
                  <div className="relative">
                    <div className="w-64 h-64 mx-auto rounded-full gradient-primary/10 border-4 border-primary/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl font-bold mb-2">{formatTime(timeLeft)}</div>
                        <div className="text-sm text-muted-foreground">{focusCategory}</div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Progress value={progress} className="h-3" />
                    </div>
                  </div>

                  {/* Duration Selection */}
                  {!isActive && (
                    <div className="space-y-4">
                      <div>
                        <Label>Focus Duration</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {[15, 25, 45, 60].map((duration) => (
                            <Button
                              key={duration}
                              variant="outline"
                              onClick={() => {
                                setSelectedDuration(duration);
                                setTimeLeft(duration * 60);
                              }}
                              className={cn(
                                "border-border/50",
                                selectedDuration === duration && "gradient-primary text-primary-foreground border-0"
                              )}
                            >
                              {duration}m
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={focusCategory} onValueChange={setFocusCategory}>
                          <SelectTrigger id="category" className="mt-2 bg-secondary/50 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Study">Study</SelectItem>
                            <SelectItem value="Assignment">Assignment</SelectItem>
                            <SelectItem value="Reading">Reading</SelectItem>
                            <SelectItem value="Project">Project Work</SelectItem>
                            <SelectItem value="Review">Review</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Timer Controls */}
                  <div className="flex gap-3">
                    {!isActive ? (
                      <Button
                        onClick={startTimer}
                        className="flex-1 gradient-primary text-primary-foreground border-0 h-14 text-lg font-medium gap-2"
                      >
                        <Play className="h-5 w-5" />
                        Start Focus Session
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={pauseTimer}
                          className="flex-1 h-14 text-lg font-medium gap-2"
                          variant="outline"
                        >
                          {isPaused ? (
                            <>
                              <Play className="h-5 w-5" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="h-5 w-5" />
                              Pause
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={resetTimer}
                          className="flex-1 h-14 text-lg font-medium gap-2"
                          variant="outline"
                        >
                          <RotateCcw className="h-5 w-5" />
                          Reset
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Active Session Warning */}
                  {isActive && (
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                      <Focus className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-primary">Focus Mode Active</p>
                        <p className="text-sm text-muted-foreground">
                          If the browser extension is installed, distracting websites are now blocked!
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              {/* Focus Settings */}
              <Card className="glass-card border-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Focus Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Block Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Silence browser notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationsBlocked}
                      onCheckedChange={setNotificationsBlocked}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Fullscreen Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Hide browser UI elements
                      </p>
                    </div>
                    <Switch
                      checked={fullscreenMode}
                      onCheckedChange={setFullscreenMode}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sound Alerts</Label>
                      <p className="text-xs text-muted-foreground">
                        Play sound when complete
                      </p>
                    </div>
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={setSoundEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Break</Label>
                      <p className="text-xs text-muted-foreground">
                        Remind to take breaks
                      </p>
                    </div>
                    <Switch
                      checked={autoBreak}
                      onCheckedChange={setAutoBreak}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Blocked Websites */}
              <Card className="glass-card border-border/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Blocked Sites
                    </CardTitle>
                    <Dialog open={isAddSiteDialogOpen} onOpenChange={setIsAddSiteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card border-border/50">
                        <DialogHeader>
                          <DialogTitle>Add Blocked Site</DialogTitle>
                          <DialogDescription>
                            Add a website to block during focus sessions
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="site-name">Site Name</Label>
                            <Input
                              id="site-name"
                              value={newSiteName}
                              onChange={(e) => setNewSiteName(e.target.value)}
                              placeholder="e.g., Reddit"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="site-url">URL</Label>
                            <Input
                              id="site-url"
                              value={newSiteUrl}
                              onChange={(e) => setNewSiteUrl(e.target.value)}
                              placeholder="e.g., reddit.com"
                              className="mt-2"
                            />
                          </div>
                          <Button onClick={addBlockedSite} className="w-full">
                            Add Site
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardDescription>
                    These sites will be blocked by the browser extension
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {blockedSites.map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30"
                      >
                        <div>
                          <p className="font-medium text-sm">{site.name}</p>
                          <p className="text-xs text-muted-foreground">{site.url}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBlockedSite(site.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How It Works */}
          <Card className="glass-card border-border/30 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                How Focus Mode Works
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Notification Control</h3>
                <p className="text-sm text-muted-foreground">
                  Requests notification permission to alert you when sessions complete and help you stay focused.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mb-3">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Website Blocking</h3>
                <p className="text-sm text-muted-foreground">
                  Install the browser extension from the <code className="text-xs">browser-extension</code> folder for real website blocking during focus sessions.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center mb-3">
                  <Focus className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Fullscreen Option</h3>
                <p className="text-sm text-muted-foreground">
                  Enables fullscreen mode to minimize UI distractions. Press ESC to exit anytime.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}