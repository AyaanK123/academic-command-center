import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCourses } from "@/contexts/CoursesContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const careerOptions = [
  "AI Researcher",
  "Software Engineer",
  "Data Scientist",
  "Cybersecurity Specialist",
  "Core Electrical Engineer",
  "Mechanical Design Engineer",
  "Civil Infrastructure Engineer",
  "Chemical Process Engineer",
];

export default function OnboardingSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createUserProfile, updateUserProfile } = useCourses();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    branch: "",
    currentSemester: 1,
    previousCGPA: 0,
    targetCGPA: 9,
    careerGoal: "AI Researcher",
    totalCreditsEarned: 0,
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.branch || formData.currentSemester < 1) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      await createUserProfile({
        branch: formData.branch,
        current_semester: formData.currentSemester,
        previous_cgpa: formData.previousCGPA,
        target_cgpa: formData.targetCGPA,
        career_goal: formData.careerGoal,
        total_credits_earned: formData.totalCreditsEarned,
      });

      toast({
        title: "Profile Created! 🎉",
        description: "Let's set up your courses",
      });

      // Redirect to current semester page to add courses
      navigate("/current-semester");
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl glass-card border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to AcadSync 🎓</CardTitle>
          <CardDescription className="text-lg">
            Let's set up your academic profile
          </CardDescription>
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-20 rounded-full transition-all ${
                  s <= step ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Academic Information</h3>
                <p className="text-sm text-muted-foreground">Tell us about your current studies</p>
              </div>

              <div>
                <Label htmlFor="branch" className="text-sm font-medium">Branch/Department *</Label>
                <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value })}>
                  <SelectTrigger className="mt-2 bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Select your branch" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50">
                    <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
                    <SelectItem value="EE">Electrical Engineering</SelectItem>
                    <SelectItem value="ME">Mechanical Engineering</SelectItem>
                    <SelectItem value="CE">Civil Engineering</SelectItem>
                    <SelectItem value="CH">Chemical Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="semester" className="text-sm font-medium">Current Semester *</Label>
                <Input
                  id="semester"
                  type="number"
                  min={1}
                  max={8}
                  value={formData.currentSemester}
                  onChange={(e) => setFormData({ ...formData, currentSemester: Number(e.target.value) })}
                  className="mt-2 bg-secondary/50 border-border/50"
                  placeholder="e.g., 3"
                />
              </div>

              <div>
                <Label htmlFor="totalCredits" className="text-sm font-medium">Total Credits Earned So Far</Label>
                <Input
                  id="totalCredits"
                  type="number"
                  min={0}
                  value={formData.totalCreditsEarned}
                  onChange={(e) => setFormData({ ...formData, totalCreditsEarned: Number(e.target.value) })}
                  className="mt-2 bg-secondary/50 border-border/50"
                  placeholder="e.g., 40"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave as 0 if you're in semester 1</p>
              </div>

              <Button onClick={handleNext} className="w-full gradient-primary text-primary-foreground h-12">
                Next Step →
              </Button>
            </div>
          )}

          {/* Step 2: CGPA Info */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Academic Performance</h3>
                <p className="text-sm text-muted-foreground">Set your CGPA goals</p>
              </div>

              <div>
                <Label htmlFor="previousCGPA" className="text-sm font-medium">Previous CGPA</Label>
                <Input
                  id="previousCGPA"
                  type="number"
                  min={0}
                  max={10}
                  step={0.01}
                  value={formData.previousCGPA}
                  onChange={(e) => setFormData({ ...formData, previousCGPA: Number(e.target.value) })}
                  className="mt-2 bg-secondary/50 border-border/50"
                  placeholder="e.g., 8.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.currentSemester === 1 ? "Leave as 0 for first semester" : "Enter your CGPA till last semester"}
                </p>
              </div>

              <div>
                <Label htmlFor="targetCGPA" className="text-sm font-medium">Target CGPA</Label>
                <Input
                  id="targetCGPA"
                  type="number"
                  min={0}
                  max={10}
                  step={0.01}
                  value={formData.targetCGPA}
                  onChange={(e) => setFormData({ ...formData, targetCGPA: Number(e.target.value) })}
                  className="mt-2 bg-secondary/50 border-border/50"
                  placeholder="e.g., 9.0"
                />
                <p className="text-xs text-muted-foreground mt-1">What CGPA do you want to achieve?</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  ← Back
                </Button>
                <Button onClick={handleNext} className="flex-1 gradient-primary text-primary-foreground">
                  Next Step →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Career Goal */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Career Goals</h3>
                <p className="text-sm text-muted-foreground">Help us recommend the best courses for you</p>
              </div>

              <div>
                <Label htmlFor="careerGoal" className="text-sm font-medium">What's your career goal?</Label>
                <Select value={formData.careerGoal} onValueChange={(value) => setFormData({ ...formData, careerGoal: value })}>
                  <SelectTrigger className="mt-2 bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50">
                    {careerOptions.map(career => (
                      <SelectItem key={career} value={career}>{career}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  We'll recommend electives based on your career path
                </p>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <h4 className="font-semibold mb-2 text-sm">Summary</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Branch: <span className="text-foreground font-medium">{formData.branch}</span></p>
                  <p>Semester: <span className="text-foreground font-medium">{formData.currentSemester}</span></p>
                  <p>Previous CGPA: <span className="text-foreground font-medium">{formData.previousCGPA}</span></p>
                  <p>Target CGPA: <span className="text-foreground font-medium">{formData.targetCGPA}</span></p>
                  <p>Career Goal: <span className="text-foreground font-medium">{formData.careerGoal}</span></p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  ← Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1 gradient-primary text-primary-foreground">
                  Complete Setup ✓
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}