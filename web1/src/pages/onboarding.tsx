import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useCourses } from "../contexts/CoursesContext";
import { useToast } from "../hooks/use-toast";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUserProfile } = useCourses();
  const [branch, setBranch] = useState("CSE");

  const branches = [
    { value: "CSE", label: "Computer Science & Engineering" },
    { value: "EE", label: "Electrical Engineering" },
    { value: "ME", label: "Mechanical Engineering" },
    { value: "CE", label: "Civil Engineering" },
    { value: "CH", label: "Chemical Engineering" },
  ];

  const handleContinue = async () => {
    try {
      // Save branch to Supabase user profile
      await updateUserProfile({
        branch: branch,
        current_semester: 1, // Default to semester 1
      });

      toast({
        title: "Profile Updated",
        description: "Your branch has been saved",
      });

      navigate("/previous-semester");
    } catch (error) {
      console.error("Error saving branch:", error);
      toast({
        title: "Error",
        description: "Failed to save branch",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary glow-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to AcadSync</h1>
          <p className="text-muted-foreground">
            Let's set up your academic profile
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          <div className="space-y-6">
            <div>
              <label className="block mb-3 font-medium text-lg">
                Select Your Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-12 px-4 border rounded-lg bg-muted/50 focus:ring-2 focus:ring-primary text-base"
              >
                {branches.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <button
                onClick={handleContinue}
                className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                Continue to Academic Details →
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            You'll be able to change this later in settings
          </p>
        </div>
      </div>
    </div>
  );
}