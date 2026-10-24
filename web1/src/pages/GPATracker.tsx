import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Award, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";


type Course = {
  name: string;
  code: string;
  credits: number;
  grade?: string;
  semester?: number;
};

const gradePoints: Record<string, number> = {
  AA: 10,
  AB: 9,
  BB: 8,
  BC: 7,
  CC: 6,
  CD: 5,
  DD: 4,
  FR: 0,
};

export default function GPATracker() {
  const [previousCGPA, setPreviousCGPA] = useState<number>(0);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [semesterRecords, setSemesterRecords] = useState<any[]>([]);
  const navigate = useNavigate();


  useEffect(() => {
    const prevCoursesRaw = localStorage.getItem("previousSemesterCourses");
    const prevSemRaw = localStorage.getItem("previousSemesterNumber");
    const storedCGPA = Number(localStorage.getItem("previousCGPA") || "0");

    const prevCourses: Course[] = prevCoursesRaw ? JSON.parse(prevCoursesRaw) : [];

    const semesterMap: Record<number, Course[]> = {};

    prevCourses.forEach(course => {
      const sem = course.semester || 1;
      if (!semesterMap[sem]) semesterMap[sem] = [];
      semesterMap[sem].push(course);
    });

    const semesterStats = Object.entries(semesterMap).map(([sem, courses]) => {
      let totalPoints = 0;
      let credits = 0;

      courses.forEach(course => {
        const grade = course.grade || "CC";
        totalPoints += gradePoints[grade] * course.credits;
        credits += course.credits;
      });

      const sgpa = credits > 0 ? (totalPoints / credits).toFixed(2) : "0.00";

      return {
        semester: `Semester ${sem}`,
        gpa: sgpa,
        credits
      };
    });

    const totalCreditsCompleted = prevCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

    setSemesterRecords(semesterStats.reverse());
    setTotalCredits(totalCreditsCompleted);
    setPreviousCGPA(storedCGPA);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">GPA Tracker</h1>
            <p className="text-muted-foreground">
              Monitor your academic performance and track your progress
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{previousCGPA.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From completed semesters</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cumulative GPA</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{previousCGPA.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Overall performance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credits Completed</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCredits}</div>
                <p className="text-xs text-muted-foreground">Across all semesters</p>
              </CardContent>
            </Card>
          </div>

          {/* Semester Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Semester Performance</CardTitle>
                <CardDescription>Your GPA breakdown by semester</CardDescription>
              </div>

              <button
                onClick={() => navigate("/previous-semester")}
                className="text-xl font-medium text-primary hover:underline"
              >
                Edit Records →
              </button>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">

                {semesterRecords.length > 0 ? (
                  semesterRecords.map((item) => (
                    <div key={item.semester} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <h3 className="font-medium">{item.semester}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.credits} credits completed
                        </p>
                      </div>
                      <div className="text-2xl font-bold">{item.gpa}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No semester records found yet.
                  </p>
                )}

              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
