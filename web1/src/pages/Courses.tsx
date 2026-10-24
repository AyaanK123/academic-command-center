import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCourses } from "@/contexts/CoursesContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, GraduationCap, Target, TrendingUp, Plus, AlertCircle } from "lucide-react";

type Course = {
  id?: string;
  name: string;
  code: string;
  credits: number;
  slot: string;
  type: "Core" | "Elective";
  semester_number?: number;
  is_current_semester?: boolean;
  grade?: string | null;
  is_completed?: boolean;
};

export default function Courses() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    courses,
    userProfile,
    loading,
    addCourse,
    deleteCourse,
    getCurrentSemesterCourses,
    getCompletedCourses,
  } = useCourses();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    credits: "",
    slot: "",
    type: "Core" as "Core" | "Elective",
  });

  const handleAddCourse = async () => {
    if (!userProfile) {
      toast({
        title: "Setup Required",
        description: "Please complete your profile setup first",
        variant: "destructive",
      });
      navigate("/onboarding");
      return;
    }

    if (!formData.name || !formData.code || !formData.credits || !formData.slot) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await addCourse({
        name: formData.name,
        code: formData.code,
        credits: Number(formData.credits),
        slot: formData.slot,
        type: formData.type,
        semester_number: userProfile.current_semester,
        is_current_semester: true,
      });

      toast({
        title: "Course Added",
        description: `${formData.name} has been added to your courses`,
      });

      // Reset form
      setFormData({
        name: "",
        code: "",
        credits: "",
        slot: "",
        type: "Core",
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add course",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCourse = async (courseId: string, courseName: string) => {
    try {
      await deleteCourse(courseId);
      toast({
        title: "Course Removed",
        description: `${courseName} has been removed`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove course",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 px-6 py-10 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  const currentCourses = getCurrentSemesterCourses();
  const completedCourses = getCompletedCourses();

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  const currentSemesterCredits = currentCourses.reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 px-6 py-10 text-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 text-gradient-primary">My Courses</h1>
              <p className="text-muted-foreground text-lg">
                Manage your academic courses and track your progress
              </p>
            </div>

            {userProfile && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2 gradient-primary text-primary-foreground">
                    <Plus className="h-5 w-5" />
                    Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Course</DialogTitle>
                    <DialogDescription>
                      Enter the course details manually
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="name">Course Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Data Structures"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="code">Course Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., CS201"
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="credits">Credits *</Label>
                        <Input
                          id="credits"
                          type="number"
                          min={1}
                          max={10}
                          value={formData.credits}
                          onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                          placeholder="e.g., 4"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="slot">Slot *</Label>
                        <Input
                          id="slot"
                          value={formData.slot}
                          onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
                          placeholder="e.g., A1"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="type">Course Type *</Label>
                      <Select value={formData.type} onValueChange={(value: "Core" | "Elective") => setFormData({ ...formData, type: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Core">Core</SelectItem>
                          <SelectItem value="Elective">Elective</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleAddCourse}
                      className="w-full gradient-primary text-primary-foreground"
                    >
                      Add Course
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Show profile setup prompt if no profile */}
          {!userProfile && (
            <Card className="glass-card border-border/30 mb-8 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
                    <p className="text-muted-foreground mb-4">
                      Set up your academic profile to start managing courses
                    </p>
                    <Button 
                      onClick={() => navigate("/onboarding")} 
                      className="gradient-primary text-primary-foreground"
                    >
                      Setup Profile Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          {userProfile && (
            <>
              <div className="grid gap-6 md:grid-cols-4 mb-10">
                <Card className="glass-card-hover border-border/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
                    <BookOpen className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{courses.length}</div>
                  </CardContent>
                </Card>

                <Card className="glass-card-hover border-border/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Current Semester</CardTitle>
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{currentCourses.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">{currentSemesterCredits} credits</p>
                  </CardContent>
                </Card>

                <Card className="glass-card-hover border-border/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                    <Target className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{completedCourses.length}</div>
                  </CardContent>
                </Card>

                <Card className="glass-card-hover border-border/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalCredits}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Semester Courses */}
              <Card className="glass-card border-border/30 mb-8">
                <CardHeader>
                  <CardTitle>Current Semester Courses</CardTitle>
                  <CardDescription>Semester {userProfile?.current_semester}</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No courses enrolled for this semester</p>
                      <Button 
                        onClick={() => navigate("/current-semester")} 
                        className="mt-4 gradient-primary text-primary-foreground"
                      >
                        Plan Current Semester
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentCourses.map(course => (
                        <div key={course.id} className="flex justify-between items-center p-4 rounded-xl border bg-card">
                          <div>
                            <p className="font-medium">{course.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {course.code} • {course.credits} Credits • Slot {course.slot} • {course.type}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCourse(course.id!, course.name)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}