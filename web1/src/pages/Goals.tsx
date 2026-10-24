import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Trophy, Calendar, CheckCircle2, Plus, Edit, Trash2, Sparkles, Clock, Archive, TrendingUp, AlertCircle, Upload, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGoals, Goal } from "@/contexts/GoalsContext";
import { cn } from "@/lib/utils";

export default function Goals() {
  const { toast } = useToast();
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'success' | 'fallback'>('idle');
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<"active" | "completed">("active");
  const [isPdfParsing, setIsPdfParsing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    deadline: "",
    estimatedTime: "",
    course: "",
  });

  const activeGoals = goals.filter(g => g.status !== "Completed" && !g.archived);
  const completedGoals = goals.filter(g => g.status === "Completed" && !g.archived);

  const stats = [
    { label: "Total Goals", value: activeGoals.length.toString(), icon: Target, gradient: "gradient-primary", glow: "glow-primary" },
    { label: "Completed", value: completedGoals.length.toString(), icon: CheckCircle2, gradient: "gradient-success", glow: "glow-success" },
    { label: "In Progress", value: goals.filter(g => g.status === "In Progress").length.toString(), icon: TrendingUp, gradient: "gradient-accent", glow: "glow-accent" },
    { label: "Success Rate", value: `${goals.length > 0 ? Math.round((completedGoals.length / (activeGoals.length + completedGoals.length)) * 100) : 0}%`, icon: Trophy, gradient: "gradient-primary", glow: "glow-primary" },
  ];

  const extractInfoFromText = (text: string) => {
    const result: any = {
      title: "",
      description: "",
      deadline: "",
      category: "",
      course: "",
      estimatedTime: "",
    };

    const cleanText = text.replace(/\s+/g, ' ').trim();

    // Extract title
    const titlePatterns = [
      /(?:subject|title|assignment|project|task|goal):\s*([^\n.;]{5,100})/i,
      /(?:name|topic):\s*([^\n.;]{5,100})/i,
    ];
    
    for (const pattern of titlePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        result.title = match[1].trim();
        break;
      }
    }

    if (!result.title) {
      const sentences = cleanText.split(/[.!?]\s+/);
      for (const sentence of sentences) {
        if (sentence.length >= 10 && sentence.length <= 100) {
          result.title = sentence.trim();
          break;
        }
      }
    }

    // Extract deadline
    const datePatterns = [
      /(?:due|deadline|submit|submission|by).*?(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i,
      /(?:due|deadline|submit|submission|by).*?(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
      /(?:due|deadline|submit|submission|by).*?(\d{4}-\d{2}-\d{2})/i,
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/,
      /(\d{4}-\d{2}-\d{2})/,
    ];

    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        try {
          const dateStr = match[1].trim();
          let parsedDate: Date | null = null;

          if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
            parsedDate = new Date(dateStr);
          } else if (dateStr.match(/\d{1,2}[-/]\d{1,2}[-/]\d{4}/)) {
            const parts = dateStr.split(/[-/]/);
            parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            parsedDate = new Date(dateStr);
          }

          if (parsedDate && !isNaN(parsedDate.getTime())) {
            result.deadline = parsedDate.toISOString().split('T')[0];
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Extract course code
    const coursePatterns = [
      /(?:course|class|subject code):\s*([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/i,
      /\b([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\b/,
    ];

    for (const pattern of coursePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        result.course = match[1].trim().replace(/\s+/g, '');
        break;
      }
    }

    // Extract estimated time
    const timePatterns = [
      /(?:estimated|expected|duration|time required):\s*(\d+\s*(?:hours?|hrs?|days?|weeks?))/i,
      /(?:will take|takes|requires)\s*(?:about|approximately)?\s*(\d+\s*(?:hours?|hrs?|days?|weeks?))/i,
    ];

    for (const pattern of timePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        result.estimatedTime = match[1].trim();
        break;
      }
    }

    // Determine category
    const categoryKeywords = {
      "Assignment": ["assignment", "homework", "hw", "problem set", "submit", "submission"],
      "Academic": ["exam", "test", "quiz", "midterm", "final", "study", "lecture", "course"],
      "Skills": ["learn", "skill", "practice", "training", "develop", "improve", "master"],
      "Career": ["job", "career", "interview", "internship", "resume", "cv", "application"],
      "Learning": ["tutorial", "course", "lesson", "workshop", "seminar", "webinar"],
    };

    const lowerText = cleanText.toLowerCase();
    let maxMatches = 0;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        result.category = category;
      }
    }

    // Extract description
    const descPatterns = [
      /(?:description|overview|details|objective|about):\s*([^\n]{30,400})/i,
      /(?:you (?:will|should|need to|must))([^\n]{30,400})/i,
    ];

    for (const pattern of descPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        result.description = match[1].trim();
        break;
      }
    }

    if (!result.description) {
      const chunks = cleanText.split(/[.!?]\s+/).filter(s => s.length >= 30 && s.length <= 400);
      if (chunks.length > 0) {
        result.description = chunks[0].trim();
      }
    }

    return result;
  };

  const parsePdfFile = async (file: File) => {
    setIsPdfParsing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = "";
      
      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 5); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + "\n";
      }

      const extractedData = extractInfoFromText(fullText);

      setFormData({
        title: extractedData.title || formData.title,
        description: extractedData.description || formData.description,
        deadline: extractedData.deadline || formData.deadline,
        category: extractedData.category || formData.category,
        course: extractedData.course || formData.course,
        estimatedTime: extractedData.estimatedTime || formData.estimatedTime,
      });

      toast({
        title: "PDF Parsed Successfully",
        description: `Extracted: ${[
          extractedData.title && "title",
          extractedData.deadline && "deadline",
          extractedData.course && "course",
          extractedData.category && "category"
        ].filter(Boolean).join(", ")}`,
      });
      
    } catch (error) {
      console.error("PDF parsing error:", error);
      toast({
        title: "PDF Parsing Failed",
        description: "Could not extract information. Please fill manually.",
        variant: "destructive",
      });
    } finally {
      setIsPdfParsing(false);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        parsePdfFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeGoalWithAI = async (goal: any) => {
    setIsAiAnalyzing(true);
    setAiStatus('analyzing');

    try {
      const { analyzeGoalWithAI: geminiAnalyze } = await import("@/lib/gemini");
      const result = await geminiAnalyze({
        title: goal.title,
        description: goal.description,
        deadline: goal.deadline,
        category: goal.category,
      });
      
      setAiStatus('success');
      setIsAiAnalyzing(false);
      return result;

    } catch (error) {
      const { getFallbackAnalysis } = await import("@/lib/gemini");
      const result = getFallbackAnalysis({
        title: goal.title,
        description: goal.description,
        deadline: goal.deadline,
        category: goal.category,
      });
      
      setAiStatus('fallback');
      setIsAiAnalyzing(false);
      return result;
    }
  };

  const handleAddGoal = async () => {
    if (!formData.title || !formData.deadline) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and deadline",
        variant: "destructive",
      });
      return;
    }

    const aiAnalysis = await analyzeGoalWithAI(formData);

    const newGoal: any = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: formData.category || "Other",
      progress: 0,
      deadline: formData.deadline,
      status: "Not Started",
      priority: aiAnalysis.priority,
      estimatedTime: formData.estimatedTime || "Not specified",
      course: formData.course,
      archived: false,
      aiRating: {
        urgency: aiAnalysis.urgency,
        importance: aiAnalysis.importance,
        difficulty: aiAnalysis.difficulty,
        suggestion: aiAnalysis.suggestion,
      },
    };

    addGoal(newGoal);
    setIsAddDialogOpen(false);
    setFormData({
      title: "",
      description: "",
      category: "",
      deadline: "",
      estimatedTime: "",
      course: "",
    });

    toast({
      title: "Goal Added Successfully",
      description: aiStatus === 'success'
        ? `AI Priority: ${aiAnalysis.priority.toUpperCase()}`
        : `Smart Priority: ${aiAnalysis.priority.toUpperCase()}`,
    });

    setAiStatus('idle');
  };

  const handleUpdateGoal = async () => {
    if (!currentGoal) return;

    const aiAnalysis = await analyzeGoalWithAI({
      ...currentGoal,
      ...formData,
    });

    updateGoal(currentGoal.id, {
      title: formData.title || currentGoal.title,
      description: formData.description || currentGoal.description,
      category: formData.category || currentGoal.category,
      deadline: formData.deadline || currentGoal.deadline,
      estimatedTime: formData.estimatedTime || currentGoal.estimatedTime,
      course: formData.course || currentGoal.course,
      priority: aiAnalysis.priority,
      aiRating: {
        urgency: aiAnalysis.urgency,
        importance: aiAnalysis.importance,
        difficulty: aiAnalysis.difficulty,
        suggestion: aiAnalysis.suggestion,
      },
    });

    setIsEditDialogOpen(false);
    setCurrentGoal(null);
    setFormData({
      title: "",
      description: "",
      category: "",
      deadline: "",
      estimatedTime: "",
      course: "",
    });

    toast({
      title: "Goal Updated",
      description: "Priority has been recalculated",
    });

    setAiStatus('idle');
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
    toast({
      title: "Goal Deleted",
      description: "Goal has been removed from your list",
    });
  };

  const openEditDialog = (goal: Goal) => {
    setCurrentGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      deadline: goal.deadline,
      estimatedTime: goal.estimatedTime,
      course: goal.course || "",
    });
    setIsEditDialogOpen(true);
  };

  const updateGoalProgress = (id: string, progress: number) => {
    updateGoal(id, {
      progress,
      status: progress === 100 ? "In Progress" : progress > 0 ? "In Progress" : "Not Started"
    });
  };

  const markAsComplete = (id: string) => {
    updateGoal(id, { status: "Completed" });
    toast({
      title: "Goal Completed! 🎉",
      description: "Congratulations on achieving your goal!",
    });
  };

  const archiveGoal = (id: string) => {
    updateGoal(id, { archived: true });
    toast({
      title: "Goal Archived",
      description: "Goal has been moved to archives",
    });
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/20 text-destructive border-destructive/30";
      case "medium": return "bg-accent/20 text-accent border-accent/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const displayedGoals = filter === "active" ? activeGoals : completedGoals;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 text-gradient-primary">
                Goals & Objectives
              </h1>
              <p className="text-muted-foreground text-lg">
                Track your academic and personal goals with smart prioritization
              </p>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 gradient-primary text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity">
                  <Plus className="h-5 w-5" />
                  Add New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto glass-card border-border/50">

                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>
                    Create New Goal
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Upload a PDF or fill in the details manually
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 mt-4">
                  <div 
                    className="relative p-6 rounded-xl border-2 border-dashed border-border/50 bg-secondary/20 hover:bg-secondary/30 hover:border-primary/50 transition-all cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      disabled={isPdfParsing}
                    />
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
                        isPdfParsing ? "bg-primary/20" : "gradient-primary group-hover:scale-110"
                      )}>
                        {isPdfParsing ? (
                          <Sparkles className="h-7 w-7 text-primary animate-spin" />
                        ) : (
                          <Upload className="h-7 w-7 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-base font-semibold mb-1">
                          {isPdfParsing ? "Parsing PDF..." : "Upload PDF to Auto-Fill"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isPdfParsing 
                            ? "Extracting information from your document..." 
                            : "Click to upload assignment sheet or project description"
                          }
                        </p>
                      </div>
                      {!isPdfParsing && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <FileText className="h-4 w-4" />
                          <span>Supports PDF files only</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or fill manually
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Goal Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Complete Machine Learning Project"
                      className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide details about this goal..."
                      rows={3}
                      className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="mt-2 bg-secondary/50 border-border/50">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border/50">
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Assignment">Assignment</SelectItem>
                          <SelectItem value="Skills">Skills</SelectItem>
                          <SelectItem value="Learning">Learning</SelectItem>
                          <SelectItem value="Career">Career</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="deadline" className="text-sm font-medium">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estimatedTime" className="text-sm font-medium">Estimated Time</Label>
                      <Input
                        id="estimatedTime"
                        value={formData.estimatedTime}
                        onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                        placeholder="e.g., 5 hours"
                        className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="course" className="text-sm font-medium">Related Course</Label>
                      <Input
                        id="course"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        placeholder="e.g., CS405"
                        className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  {aiStatus !== 'idle' && (
                    <div className={cn(
                      "p-3 rounded-lg border text-sm flex items-center gap-2",
                      aiStatus === 'analyzing' && "bg-primary/10 border-primary/30 text-primary",
                      aiStatus === 'success' && "bg-green-500/10 border-green-500/30 text-green-400",
                      aiStatus === 'fallback' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                    )}>
                      {aiStatus === 'analyzing' && <Sparkles className="h-4 w-4 animate-spin" />}
                      {aiStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                      {aiStatus === 'fallback' && <AlertCircle className="h-4 w-4" />}
                      <span className="font-medium">
                        {aiStatus === 'analyzing' && 'Analyzing...'}
                        {aiStatus === 'success' && 'AI Analysis Complete!'}
                        {aiStatus === 'fallback' && 'Using Smart Rule-Based Analysis'}
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={handleAddGoal}
                    className="w-full gap-2 gradient-primary text-primary-foreground border-0 h-12 text-base font-medium"
                    disabled={isAiAnalyzing}
                  >
                    {isAiAnalyzing ? (
                      <>
                        <Sparkles className="h-5 w-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Add Goal with Smart Priority
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-4 mb-10">
            {stats.map((stat) => (
              <Card key={stat.label} className="glass-card-hover stat-card border-border/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
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

          <div className="flex gap-3 mb-8">
            <Button
              variant="ghost"
              onClick={() => setFilter("active")}
              className={cn(
                "px-6 py-2 rounded-xl transition-all duration-200",
                filter === "active"
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              Active Goals ({activeGoals.length})
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFilter("completed")}
              className={cn(
                "px-6 py-2 rounded-xl transition-all duration-200",
                filter === "completed"
                  ? "gradient-success text-white glow-success"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              Completed ({completedGoals.length})
            </Button>
          </div>

          <Card className="glass-card border-border/30">
            <CardHeader className="border-b border-border/30">
              <CardTitle className="text-xl">{filter === "active" ? "Current Goals" : "Completed Goals"}</CardTitle>
              <CardDescription>
                {filter === "active"
                  ? "Your active goals with smart priority ratings"
                  : "Goals you've successfully completed"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {displayedGoals.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl gradient-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Target className="h-10 w-10 text-primary/50" />
                  </div>
                  <p className="text-lg font-medium mb-2">
                    {filter === "active" ? "No active goals yet" : "No completed goals yet"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {filter === "active"
                      ? "Click 'Add New Goal' to get started"
                      : "Complete some goals to see them here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {displayedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className={cn(
                        "p-6 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/30 transition-all duration-300",
                        goal.status === "Completed" && "opacity-80"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-lg">{goal.title}</h3>
                            {goal.status !== "Completed" && (
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-semibold border",
                                getPriorityStyles(goal.priority)
                              )}>
                                {goal.priority.toUpperCase()}
                              </span>
                            )}
                            {goal.status === "Completed" && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                COMPLETED
                              </span>
                            )}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-lg">
                              <Target className="h-3.5 w-3.5" />
                              {goal.category}
                            </span>
                            <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-lg">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(goal.deadline).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-lg">
                              <Clock className="h-3.5 w-3.5" />
                              {goal.estimatedTime}
                            </span>
                            {goal.course && (
                              <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg font-medium">
                                {goal.course}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {filter === "active" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(goal)}
                                className="text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {filter === "completed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => archiveGoal(goal.id)}
                              className="text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {goal.aiRating && goal.status !== "Completed" && (
                        <div className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
                              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                            </div>
                            <span className="text-sm font-semibold text-primary">Smart Analysis</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div className="text-center p-2 rounded-lg bg-secondary/30">
                              <div className="text-xs text-muted-foreground mb-1">Urgency</div>
                              <div className="text-lg font-bold text-foreground">{goal.aiRating.urgency}<span className="text-xs text-muted-foreground">/10</span></div>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-secondary/30">
                              <div className="text-xs text-muted-foreground mb-1">Importance</div>
                              <div className="text-lg font-bold text-foreground">{goal.aiRating.importance}<span className="text-xs text-muted-foreground">/10</span></div>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-secondary/30">
                              <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
                              <div className="text-lg font-bold text-foreground">{goal.aiRating.difficulty}<span className="text-xs text-muted-foreground">/10</span></div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                            {goal.aiRating.suggestion}
                          </p>
                        </div>
                      )}

                      {goal.status !== "Completed" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold text-foreground">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2 bg-secondary/50" />
                          <div className="flex gap-2 mt-3">
                            {[0, 25, 50, 75, 100].map((value) => (
                              <Button
                                key={value}
                                variant="outline"
                                size="sm"
                                onClick={() => updateGoalProgress(goal.id, value)}
                                className={cn(
                                  "flex-1 border-border/50 transition-all",
                                  goal.progress === value
                                    ? "gradient-primary text-primary-foreground border-0"
                                    : "bg-secondary/30 hover:bg-secondary/50"
                                )}
                              >
                                {value}%
                              </Button>
                            ))}
                          </div>
                          {goal.progress === 100 && (
                            <Button
                              onClick={() => markAsComplete(goal.id)}
                              className="w-full mt-4 gap-2 gradient-success text-white border-0 h-11 font-medium"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                              Mark as Done
                            </Button>
                          )}
                        </div>
                      )}
                      {goal.status === "Completed" && (
                        <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Goal completed on {new Date(goal.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl -translate-y-1glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Goal</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your goal and recalculate priority
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div>
              <Label htmlFor="edit-title" className="text-sm font-medium">Goal Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
              />
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category" className="text-sm font-medium">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="mt-2 bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50">
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Assignment">Assignment</SelectItem>
                    <SelectItem value="Skills">Skills</SelectItem>
                    <SelectItem value="Learning">Learning</SelectItem>
                    <SelectItem value="Career">Career</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-deadline" className="text-sm font-medium">Deadline</Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-estimatedTime" className="text-sm font-medium">Estimated Time</Label>
                <Input
                  id="edit-estimatedTime"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                  className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
                />
              </div>

              <div>
                <Label htmlFor="edit-course" className="text-sm font-medium">Related Course</Label>
                <Input
                  id="edit-course"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="mt-2 bg-secondary/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>

            {aiStatus !== 'idle' && (
              <div className={cn(
                "p-3 rounded-lg border text-sm flex items-center gap-2",
                aiStatus === 'analyzing' && "bg-primary/10 border-primary/30 text-primary",
                aiStatus === 'success' && "bg-green-500/10 border-green-500/30 text-green-400",
                aiStatus === 'fallback' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              )}>
                {aiStatus === 'analyzing' && <Sparkles className="h-4 w-4 animate-spin" />}
                {aiStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {aiStatus === 'fallback' && <AlertCircle className="h-4 w-4" />}
                <span className="font-medium">
                  {aiStatus === 'analyzing' && 'Analyzing with AI...'}
                  {aiStatus === 'success' && 'AI Analysis Complete'}
                  {aiStatus === 'fallback' && 'Using Smart Rule-Based Analysis'}
                </span>
              </div>
            )}

            <Button
              onClick={handleUpdateGoal}
              className="w-full gap-2 gradient-primary text-primary-foreground border-0 h-12 text-base font-medium"
              disabled={isAiAnalyzing}
            >
              {isAiAnalyzing ? (
                <>
                  <Sparkles className="h-5 w-5 animate-spin" />
                  Recalculating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Update Goal
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}