import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Course = {
  name: string;
  code: string;
  grade: string;
  credits: number;
  semester: number;
};

// IIT Grade → Points Mapping
const gradePointsMap: Record<string, number> = {
  AA: 10,
  AB: 9,
  BB: 8,
  BC: 7,
  CC: 6,
  CD: 5,
  DD: 4,
  FR: 0,
};

export default function PreviousSemester() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([
    { name: "", code: "", grade: "AA", credits: 3, semester: 1 },
  ]);

  const handleChange = (
    index: number,
    field: keyof Course,
    value: string | number
  ) => {
    const updated = [...courses];
    updated[index] = { ...updated[index], [field]: value };
    setCourses(updated);
  };

  const addCourse = () => {
    setCourses([
      ...courses,
      { name: "", code: "", grade: "AA", credits: 3, semester: 1 },
    ]);
  };

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  // Calculate CGPA
  const calculateCGPA = () => {
    let totalCredits = 0;
    let totalPoints = 0;

    courses.forEach((course) => {
      const points = gradePointsMap[course.grade] || 0;
      totalCredits += course.credits;
      totalPoints += points * course.credits;
    });

    return totalCredits === 0 ? "0.00" : (totalPoints / totalCredits).toFixed(2);
  };

  // Get latest semester number
  const getMaxSemester = () => {
    return Math.max(...courses.map((c) => c.semester || 1));
  };

  const handleSave = () => {
    const cgpa = calculateCGPA();
    const maxSemester = getMaxSemester();

    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

    localStorage.setItem("previousSemesterCourses", JSON.stringify(courses));
    localStorage.setItem("previousSemesterNumber", maxSemester.toString());
    localStorage.setItem("previousCGPA", cgpa);
    localStorage.setItem("previousCredits", totalCredits.toString());

    localStorage.setItem("previousSemesterComplete", "true");

    navigate("/current-semester");
    };


  const cgpa = calculateCGPA();
  const maxSemester = getMaxSemester();

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Previous Semester Academic Record
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter all completed courses with semester number to calculate CGPA.
          </p>
        </div>

        {/* Column Headings */}
        <div className="hidden md:grid grid-cols-5 gap-4 mb-2 text-sm font-semibold text-muted-foreground">
          <span>Course Name</span>
          <span>Course Code</span>
          <span>Grade</span>
          <span>Credits</span>
          <span>Semester</span>
        </div>

        {/* Courses */}
        <div className="space-y-4">
          {courses.map((course, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 p-5 rounded-xl border border-border bg-card shadow-sm"
            >
              <input
                placeholder="Course Name"
                value={course.name}
                onChange={(e) => handleChange(index, "name", e.target.value)}
                className="h-11 px-3 rounded-md border bg-muted/50 focus:ring-1 focus:ring-primary"
              />

              <input
                placeholder="Course Code"
                value={course.code}
                onChange={(e) => handleChange(index, "code", e.target.value)}
                className="h-11 px-3 rounded-md border bg-muted/50 focus:ring-1 focus:ring-primary"
              />

              <select
                value={course.grade}
                onChange={(e) => handleChange(index, "grade", e.target.value)}
                className="h-11 px-3 rounded-md border bg-muted/50 focus:ring-1 focus:ring-primary"
              >
                {Object.keys(gradePointsMap).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Credits"
                value={course.credits}
                onChange={(e) => handleChange(index, "credits", Number(e.target.value))}
                className="h-11 px-3 rounded-md border bg-muted/50 focus:ring-1 focus:ring-primary"
                min={1}
              />

              <input
                type="number"
                placeholder="Semester"
                value={course.semester}
                onChange={(e) => handleChange(index, "semester", Number(e.target.value))}
                className="h-11 px-3 rounded-md border bg-muted/50 focus:ring-1 focus:ring-primary"
                min={1}
              />

              <button
                onClick={() => removeCourse(index)}
                className="md:col-span-5 text-sm text-destructive hover:underline text-right"
              >
                Remove Course
              </button>
            </div>
          ))}
        </div>

        {/* Add Course */}
        <div className="mt-6">
          <button
            onClick={addCourse}
            className="px-4 py-2 rounded-lg border hover:bg-muted transition"
          >
            + Add Another Course
          </button>
        </div>

        {/* Summary Panel */}
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-card border shadow-sm">
            <p className="text-sm text-muted-foreground">Calculated CGPA</p>
            <p className="text-2xl font-bold text-primary">{cgpa}</p>
          </div>

          <div className="p-6 rounded-xl bg-card border shadow-sm">
            <p className="text-sm text-muted-foreground">Latest Semester Completed</p>
            <p className="text-2xl font-bold">Semester {maxSemester}</p>
          </div>
        </div>

        {/* Save */}
        <div className="mt-8 text-right">
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Save & Continue →
          </button>
        </div>

      </div>
    </div>
  );
}
