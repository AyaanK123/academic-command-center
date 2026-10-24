// src/pages/Index.tsx - Updated with Google Classroom
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle,
  Zap,
  RefreshCw,
  Link as LinkIcon,
  AlertCircle
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GpaRing } from "@/components/dashboard/GpaRing";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { GpaCalculator } from "@/components/dashboard/GpaCalculator";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { useGoals } from "@/contexts/GoalsContext";
import { useCourses } from "@/contexts/CoursesContext";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Index() {
  const navigate = useNavigate();
  const { goals, getHighPriorityTasks } = useGoals();
  const {
    courses,
    userProfile,
    loading: coursesLoading,
    getCurrentSemesterCourses,
    getCompletedCourses,
  } = useCourses();
  
  const { 
    isConnected: isClassroomConnected,
    isLoading: classroomLoading,
    activities: classroomActivities,
    upcomingAssignments,
    connect: connectClassroom,
    refresh: refreshClassroom,
    lastSynced
  } = useClassroom();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConnectPrompt, setShowConnectPrompt] = useState(true);

  // Convert goals to tasks format
  const goalTasks = useMemo(() => {
    const priorityTasks = getHighPriorityTasks();
    
    return priorityTasks.map(goal => {
      const deadline = new Date(goal.deadline);
      const now = new Date();
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let dueDate = "";
      if (daysUntil === 0) {
        dueDate = "Today, 11:59 PM";
      } else if (daysUntil === 1) {
        dueDate = "Tomorrow, 11:59 PM";
      } else if (daysUntil < 7) {
        dueDate = `In ${daysUntil} days`;
      } else {
        dueDate = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      return {
        title: goal.title,
        course: goal.course || goal.category,
        dueDate,
        priority: goal.priority,
        estimatedTime: goal.estimatedTime,
        progress: goal.progress,
      };
    });
  }, [goals, getHighPriorityTasks]);

  // Merge classroom assignments with goals
  const allTasks = useMemo(() => {
    const tasks = [...goalTasks];
    
    if (isClassroomConnected && upcomingAssignments.length > 0) {
      const classroomTasks = upcomingAssignments.slice(0, 6).map(assignment => {
        const now = new Date();
        const dueDate = assignment.dueDate || new Date();
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let dueDateText = "";
        if (daysUntil === 0) {
          dueDateText = "Today, 11:59 PM";
        } else if (daysUntil === 1) {
          dueDateText = "Tomorrow, 11:59 PM";
        } else if (daysUntil < 7) {
          dueDateText = `In ${daysUntil} days`;
        } else {
          dueDateText = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        return {
          title: assignment.title,
          course: assignment.courseName,
          dueDate: dueDateText,
          priority: daysUntil <= 1 ? "high" as const : daysUntil <= 3 ? "medium" as const : "low" as const,
          estimatedTime: "From Classroom",
          progress: assignment.submissionState === 'TURNED_IN' ? 100 : 0,
        };
      });
      
      tasks.push(...classroomTasks);
    }
    
    // Sort by priority and due date
    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [goalTasks, upcomingAssignments, isClassroomConnected]);

  const currentCourses = getCurrentSemesterCourses();
  const completedCourses = getCompletedCourses();
  
  const completedGoals = goals.filter(g => g.status === "Completed").length;
  const tasksInProgress = goals.filter(g => g.status === "In Progress").length;
  const totalCredits = currentCourses.reduce((sum, c) => sum + c.credits, 0);

  // Transform Google Classroom activities into activity feed format
  const activities = useMemo(() => {
    const activityList: any[] = [];

    if (isClassroomConnected && classroomActivities.length > 0) {
      classroomActivities.forEach((activity) => {
        const updateTime = activity.updatedAt;
        const now = new Date();
        const hoursAgo = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60 * 60));
        
        let timeText = "";
        if (hoursAgo < 1) {
          timeText = "Just now";
        } else if (hoursAgo < 24) {
          timeText = `${hoursAgo}h ago`;
        } else {
          const daysAgo = Math.floor(hoursAgo / 24);
          timeText = `${daysAgo}d ago`;
        }

        if (activity.type === 'assignment') {
          let activityType: "submission" | "deadline" | "announcement" = "deadline";
          let title = "";
          let description = "";
          let isNew = hoursAgo < 24;

          switch (activity.submissionState) {
            case 'TURNED_IN':
              activityType = "submission";
              title = `Submitted: ${activity.title}`;
              description = `${activity.courseName}`;
              break;
            case 'RETURNED':
              activityType = "submission";
              title = `Graded: ${activity.title}`;
              description = activity.grade !== undefined
                ? `${activity.courseName} - ${activity.grade}/${activity.maxPoints} pts`
                : `${activity.courseName} - Returned`;
              isNew = true;
              break;
            case 'CREATED':
            case 'NEW':
            default:
              activityType = "deadline";
              if (activity.dueDate) {
                const daysUntil = Math.ceil((activity.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysUntil === 0) {
                  title = `Due Today: ${activity.title}`;
                  isNew = true;
                } else if (daysUntil === 1) {
                  title = `Due Tomorrow: ${activity.title}`;
                  isNew = true;
                } else if (daysUntil > 0 && daysUntil <= 3) {
                  title = `Due Soon: ${activity.title}`;
                  isNew = true;
                } else if (daysUntil < 0) {
                  title = `Overdue: ${activity.title}`;
                  isNew = true;
                } else {
                  title = `Assignment: ${activity.title}`;
                }
                description = `${activity.courseName} - Due in ${daysUntil} days`;
              } else {
                title = `New: ${activity.title}`;
                description = activity.courseName;
              }
              break;
          }

          activityList.push({
            id: activity.id,
            type: activityType,
            title,
            description,
            time: timeText,
            isNew,
          });
        } else if (activity.type === 'announcement') {
          activityList.push({
            id: activity.id,
            type: "announcement",
            title: `${activity.courseName} Announcement`,
            description: activity.description.length > 100 
              ? activity.description.substring(0, 100) + "..." 
              : activity.description,
            time: timeText,
            isNew: hoursAgo < 24,
          });
        } else if (activity.type === 'grade') {
          activityList.push({
            id: activity.id,
            type: "submission",
            title: `New Grade: ${activity.title}`,
            description: activity.description,
            time: timeText,
            isNew: true,
          });
        }
      });
    }

    // Add goal-based activities if no classroom activities or to supplement
    const urgentGoals = goals
      .filter(g => g.status !== "Completed")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, isClassroomConnected ? 2 : 4);

    urgentGoals.forEach(goal => {
      const deadline = new Date(goal.deadline);
      const now = new Date();
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 3 && daysUntil >= 0) {
        activityList.push({
          id: `goal-${goal.id}`,
          type: "deadline" as const,
          title: daysUntil === 0 ? `Goal Due Today: ${goal.title}` : `Goal Due Soon: ${goal.title}`,
          description: `${goal.category}`,
          time: daysUntil === 0 ? "Today" : `${daysUntil} days`,
          isNew: true,
        });
      }
    });

    const recentlyCompleted = goals
      .filter(g => g.status === "Completed" && g.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 2);

    recentlyCompleted.forEach(goal => {
      const completedDate = new Date(goal.completedAt!);
      const now = new Date();
      const hoursAgo = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60));
      
      activityList.push({
        id: `completed-${goal.id}`,
        type: "submission" as const,
        title: `Completed Goal: ${goal.title}`,
        description: goal.category,
        time: hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`,
        isNew: hoursAgo < 24,
      });
    });

    // Sort by isNew first, then by most recent
    return activityList
      .sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return 0;
      })
      .slice(0, 10);
  }, [classroomActivities, isClassroomConnected, goals]);

  const handleRefreshActivities = async () => {
    setIsRefreshing(true);
    try {
      await refreshClassroom();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnectClassroom = async () => {
    try {
      await connectClassroom();
      setShowConnectPrompt(false);
    } catch (error) {
      console.error('Failed to connect classroom:', error);
    }
  };

  const previousCGPA = userProfile?.previous_cgpa || 0;
  const targetCGPA = userProfile?.target_cgpa || 0;
  const currentSemester = userProfile?.current_semester || 1;
  const previousCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0);

  if (coursesLoading || classroomLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 min-h-screen transition-all duration-300">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* Google Classroom Connection Prompt */}
          {!isClassroomConnected && showConnectPrompt && (
            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Connect Google Classroom
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Get real-time updates on assignments, grades, and announcements
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConnectPrompt(false)}
                  >
                    Later
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConnectClassroom}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Connect Now
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Overview */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Current CGPA"
              value={previousCGPA.toFixed(2)}
              subtitle="Out of 10.0"
              icon={TrendingUp}
              trend={{ value: 2.5, isPositive: true }}
              variant="primary"
            />
            <StatsCard
              title="Target CGPA"
              value={targetCGPA > 0 ? targetCGPA.toFixed(2) : "Set Goal"}
              subtitle="This semester goal"
              icon={Target}
              variant="accent"
            />
            <StatsCard
              title="Tasks Due"
              value={(tasksInProgress + upcomingAssignments.length).toString()}
              subtitle={`${allTasks.filter(t => t.priority === "high").length} high priority`}
              icon={Clock}
              variant="default"
            />
            <StatsCard
              title="Completed"
              value={completedGoals.toString()}
              subtitle="Goals this month"
              icon={CheckCircle}
              trend={{ value: 15, isPositive: true }}
              variant="success"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* GPA Overview */}
              <section className="rounded-xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">GPA Overview</h2>
                    <p className="text-sm text-muted-foreground">Your academic performance at a glance</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-around gap-6">
                  <div className="text-center">
                    <GpaRing value={previousCGPA} size="lg" label="CGPA" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <GpaRing value={previousCGPA} size="sm" />
                      <div>
                        <p className="font-medium">Semester {currentSemester}</p>
                        <p className="text-sm text-muted-foreground">Current</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <GpaRing value={Math.max(0, previousCGPA - 0.3)} size="sm" />
                      <div>
                        <p className="font-medium">Semester {currentSemester - 1}</p>
                        <p className="text-sm text-muted-foreground">Previous</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <GpaRing value={targetCGPA} size="sm" />
                      <div>
                        <p className="font-medium">Target</p>
                        <p className="text-sm text-muted-foreground">This semester</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* What to do next */}
              <section className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-accent">
                      <Zap className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">What to Do Next</h2>
                      <p className="text-sm text-muted-foreground">
                        {isClassroomConnected 
                          ? "From Google Classroom & your goals" 
                          : "AI-prioritized from your goals"}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate("/goals")}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Manage Goals
                  </button>
                </div>
                
                {allTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active tasks yet</p>
                    {!isClassroomConnected && (
                      <button 
                        onClick={handleConnectClassroom}
                        className="text-sm text-primary hover:underline mt-2"
                      >
                        Connect Classroom for assignments
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {allTasks.slice(0, 4).map((task, index) => (
                      <TaskCard key={index} {...task} />
                    ))}
                  </div>
                )}
              </section>

              {/* GPA Calculator */}
              <GpaCalculator currentCgpa={previousCGPA} completedCredits={previousCredits} />
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              {/* Activity Feed */}
              <section className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Recent Activity</h2>
                    {isClassroomConnected && lastSynced && (
                      <p className="text-xs text-muted-foreground">
                        Updated {new Date(lastSynced).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  {isClassroomConnected && (
                    <button
                      onClick={handleRefreshActivities}
                      disabled={isRefreshing}
                      className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      title="Refresh activities"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
                
                {activities.length > 0 ? (
                  <ActivityFeed activities={activities} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                    {!isClassroomConnected && (
                      <button
                        onClick={handleConnectClassroom}
                        className="text-xs text-primary hover:underline mt-2"
                      >
                        Connect Classroom for updates
                      </button>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Courses */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Your Courses</h2>
                <p className="text-sm text-muted-foreground">
                  {currentCourses.length > 0 
                    ? `Semester ${currentSemester} - ${totalCredits} credits enrolled`
                    : "No courses enrolled yet"}
                </p>
              </div>
              <button 
                onClick={() => navigate("/courses")}
                className="text-sm font-medium text-primary hover:underline"
              >
                View All
              </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {currentCourses.length > 0 ? (
                currentCourses.slice(0, 4).map((course, index) => (
                  <CourseCard 
                    key={course.id || index} 
                    code={course.code}
                    name={course.name}
                    credits={course.credits}
                    slot={course.slot}
                    progress={65 + Math.floor(Math.random() * 30)}
                  />
                ))
              ) : (
                <div className="col-span-4 text-center py-8 rounded-xl border border-border bg-card/50">
                  <p className="text-muted-foreground mb-3">No courses enrolled yet</p>
                  <button
                    onClick={() => navigate("/current-semester")}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Plan your semester →
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}