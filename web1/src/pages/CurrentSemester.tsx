import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCourses } from "@/contexts/CoursesContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getCareerCourseRecommendations, type CourseRecommendation } from "@/lib/gemini";
import { Sparkles, TrendingUp, Loader2 } from "lucide-react";

type Course = {
    id?: string;
    name: string;
    code: string;
    credits: number;
    slot: string;
    type: "Core" | "Elective";
    semester_number?: number;
    is_current_semester?: boolean;
};

type TimeBlock = {
    day: string;
    start: number;
    end: number;
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

const careerElectiveMap: Record<string, string[]> = {
    "AI Researcher": [
        "Machine Learning",
        "Artificial Intelligence",
        "Deep Learning",
        "Natural Language Processing",
        "Blockchain Systems",
    ],
    "Software Engineer": [
        "Compiler Design",
        "Software Engineering",
        "Advanced Algorithms",
        "Blockchain Systems",
        "Cloud Computing",
    ],
    "Data Scientist": [
        "Machine Learning",
        "Artificial Intelligence",
        "Big Data Analytics",
        "Data Mining",
        "Statistics for Engineers",
    ],
    "Cybersecurity Specialist": [
        "Network Security",
        "Ethical Hacking",
        "Cryptography",
    ],
    "Core Electrical Engineer": [
        "VLSI Design",
        "Embedded Systems",
        "Renewable Energy",
        "Smart Grids",
    ],
    "Mechanical Design Engineer": [
        "Robotics",
        "Finite Element Methods",
        "Automotive Engineering",
        "CAD/CAM Systems",
    ],
    "Civil Infrastructure Engineer": [
        "Earthquake Engineering",
        "Smart Cities Design",
        "Construction Planning",
    ],
    "Chemical Process Engineer": [
        "Nanomaterials",
        "Petroleum Refining",
        "Green Energy Systems",
        "Bioprocess Engineering",
    ],
};

const slotTimeMap: Record<string, TimeBlock[]> = {
    A1: [
        { day: "Mon", start: 9, end: 10 },
        { day: "Wed", start: 9, end: 10 },
        { day: "Fri", start: 9, end: 10 },
    ],
    B1: [
        { day: "Tue", start: 10, end: 11 },
        { day: "Thu", start: 10, end: 11 },
    ],
    C1: [
        { day: "Mon", start: 14, end: 15 },
        { day: "Wed", start: 14, end: 15 },
    ],
    D1: [
        { day: "Tue", start: 15, end: 16 },
        { day: "Thu", start: 15, end: 16 },
    ],
    E1: [
        { day: "Mon", start: 11, end: 12 },
        { day: "Wed", start: 11, end: 12 },
    ],
};

const courseCatalog: Record<string, Course[]> = {
    CSE: [
        { name: "Data Structures", code: "CS201", credits: 4, slot: "A1", type: "Core" },
        { name: "Operating Systems", code: "CS301", credits: 4, slot: "B1", type: "Core" },
        { name: "Database Systems", code: "CS302", credits: 3, slot: "C1", type: "Core" },
        { name: "Computer Networks", code: "CS401", credits: 3, slot: "D1", type: "Core" },
        { name: "Compiler Design", code: "CS403", credits: 3, slot: "E1", type: "Core" },
        { name: "Machine Learning", code: "CS402", credits: 4, slot: "A1", type: "Elective" },
        { name: "Artificial Intelligence", code: "CS404", credits: 4, slot: "B1", type: "Elective" },
        { name: "Blockchain Systems", code: "CS405", credits: 3, slot: "C1", type: "Elective" },
        { name: "Deep Learning", code: "CS406", credits: 4, slot: "D1", type: "Elective" },
        { name: "Natural Language Processing", code: "CS407", credits: 3, slot: "E1", type: "Elective" },
        { name: "Cloud Computing", code: "CS408", credits: 3, slot: "B1", type: "Elective" },
        { name: "Cyber Security", code: "CS409", credits: 3, slot: "C1", type: "Elective" },
    ],
    EE: [
        { name: "Circuit Analysis", code: "EE201", credits: 4, slot: "A1", type: "Core" },
        { name: "Signals & Systems", code: "EE301", credits: 4, slot: "B1", type: "Core" },
        { name: "Power Systems", code: "EE302", credits: 3, slot: "C1", type: "Core" },
        { name: "VLSI Design", code: "EE306", credits: 4, slot: "B1", type: "Elective" },
        { name: "Embedded Systems", code: "EE305", credits: 3, slot: "A1", type: "Elective" },
        { name: "Renewable Energy", code: "EE307", credits: 3, slot: "C1", type: "Elective" },
        { name: "Smart Grids", code: "EE308", credits: 3, slot: "D1", type: "Elective" },
    ],
    ME: [
        { name: "Thermodynamics", code: "ME201", credits: 4, slot: "A1", type: "Core" },
        { name: "Fluid Mechanics", code: "ME301", credits: 3, slot: "B1", type: "Core" },
        { name: "Robotics", code: "ME305", credits: 3, slot: "A1", type: "Elective" },
        { name: "Automotive Engineering", code: "ME306", credits: 3, slot: "B1", type: "Elective" },
        { name: "Finite Element Methods", code: "ME307", credits: 4, slot: "C1", type: "Elective" },
        { name: "CAD/CAM Systems", code: "ME308", credits: 3, slot: "D1", type: "Elective" },
    ],
    CE: [
        { name: "Structural Engineering", code: "CE201", credits: 4, slot: "A1", type: "Core" },
        { name: "Earthquake Engineering", code: "CE306", credits: 4, slot: "B1", type: "Elective" },
        { name: "Smart Cities Design", code: "CE307", credits: 3, slot: "C1", type: "Elective" },
        { name: "Construction Planning", code: "CE305", credits: 3, slot: "D1", type: "Elective" },
    ],
    CH: [
        { name: "Chemical Reaction Engineering", code: "CH301", credits: 4, slot: "A1", type: "Core" },
        { name: "Nanomaterials", code: "CH307", credits: 4, slot: "B1", type: "Elective" },
        { name: "Petroleum Refining", code: "CH306", credits: 3, slot: "C1", type: "Elective" },
        { name: "Green Energy Systems", code: "CH308", credits: 3, slot: "D1", type: "Elective" },
        { name: "Bioprocess Engineering", code: "CH309", credits: 3, slot: "E1", type: "Elective" },
    ],
};

const branchKeyMap: Record<string, string> = {
    CSE: "CSE", CS: "CSE",
    Electrical: "EE", EE: "EE",
    Mechanical: "ME", ME: "ME",
    Civil: "CE", CE: "CE",
    Chemical: "CH", CH: "CH",
};

export default function CurrentSemester() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const {
        courses,
        userProfile,
        loading,
        addCourse: addCourseToDb,
        deleteCourse: deleteCourseFromDb,
        updateUserProfile,
        getCurrentSemesterCourses,
        getPreviousSemesterCourses,
    } = useCourses();

    const [branch, setBranch] = useState("CSE");
    const [previousCGPA, setPreviousCGPA] = useState(0);
    const [currentSemester, setCurrentSemester] = useState(1);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const [targetCGPA, setTargetCGPA] = useState(9);
    const [requiredSGPA, setRequiredSGPA] = useState("0.00");
    const [prevCredits, setPrevCredits] = useState(0);
    const [gradePaths, setGradePaths] = useState<string[]>([]);
    const [optimizedSchedule, setOptimizedSchedule] = useState<Course[]>([]);
    const [conflictMessage, setConflictMessage] = useState("");
    const [careerGoal, setCareerGoal] = useState("AI Researcher");
    const [aiRecommendations, setAiRecommendations] = useState<CourseRecommendation[]>([]);
    const [aiExplanation, setAiExplanation] = useState("");
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);

    // Load data from Supabase (replacing localStorage)
    useEffect(() => {
        if (!loading && userProfile) {
            const storedBranch = userProfile.branch;
            const storedCGPA = userProfile.previous_cgpa;
            const currentSem = userProfile.current_semester;

            // Get previous semester courses from Supabase
            const prevCourses = getPreviousSemesterCourses();
            const prevCourseCodes = prevCourses.map((c: any) => c.code);
            const totalPrevCredits = prevCourses.reduce((sum: number, c: any) => sum + (c.credits || 0), 0);

            // Get current semester courses from Supabase
            const currentCourses = getCurrentSemesterCourses();

            const normalizedBranch = branchKeyMap[storedBranch] || "CSE";
            const branchCourses = courseCatalog[normalizedBranch] || [];

            // Filter out courses already taken or currently enrolled
            const enrolledCodes = [...prevCourseCodes, ...currentCourses.map(c => c.code)];
            const filteredCourses = branchCourses.filter(course => !enrolledCodes.includes(course.code));

            setBranch(storedBranch);
            setPreviousCGPA(storedCGPA);
            setCurrentSemester(currentSem);
            setAvailableCourses(filteredCourses);
            setSelectedCourses(currentCourses);
            setPrevCredits(totalPrevCredits);
            setTargetCGPA(userProfile.target_cgpa);
            setCareerGoal(userProfile.career_goal || "AI Researcher");

            // Calculate required SGPA if courses exist
            if (currentCourses.length > 0) {
                computeRequiredSGPA(currentCourses, userProfile.target_cgpa);
            }
        }
    }, [loading, userProfile, courses]);

    useEffect(() => {
        generateConflictFreeSchedule();
    }, [selectedCourses]);

    const generateGradePaths = (requiredSGPA: number, courses: Course[]) => {
        if (!courses.length) return setGradePaths([]);

        const grades = Object.keys(gradePoints);
        const valid: string[] = [];

        const backtrack = (i: number, path: string[], pts: number, creds: number) => {
            if (i === courses.length) {
                const sgpa = pts / creds;
                if (sgpa >= requiredSGPA) {
                    const count: Record<string, number> = {};
                    path.forEach(g => count[g] = (count[g] || 0) + 1);
                    valid.push(Object.entries(count).map(([g, n]) => `${n} ${g}`).join(" + "));
                }
                return;
            }
            for (const grade of grades) {
                const c = courses[i];
                backtrack(i + 1, [...path, grade], pts + gradePoints[grade] * c.credits, creds + c.credits);
            }
        };

        backtrack(0, [], 0, 0);
        setGradePaths([...new Set(valid)].slice(0, 3));
    };

    const getTimeBlocks = (slot: string): TimeBlock[] => slotTimeMap[slot] || [];

    const hasConflict = (existing: TimeBlock[], incoming: TimeBlock[]) =>
        existing.some(e => incoming.some(n => e.day === n.day && n.start < e.end && n.end > e.start));

    const computeRequiredSGPA = (courses: Course[], target: number) => {
        const currentCredits = courses.reduce((sum, c) => sum + c.credits, 0);
        if (!currentCredits) return setRequiredSGPA("Add courses to calculate SGPA");

        const totalCredits = prevCredits + currentCredits;
        const required = (target * totalCredits - previousCGPA * prevCredits) / currentCredits;

        if (required > 10) setRequiredSGPA("Not mathematically possible");
        else {
            const val = Math.max(0, required).toFixed(2);
            setRequiredSGPA(val);
            generateGradePaths(Number(val), courses);
        }
    };

    const addCourse = (course: Course) => {
        if (!selectedCourses.some(c => c.code === course.code)) {
            const updated = [...selectedCourses, course];
            setSelectedCourses(updated);
            computeRequiredSGPA(updated, targetCGPA);
        }
    };

    const removeCourse = async (code: string) => {
        const courseToRemove = selectedCourses.find(c => c.code === code);
        if (courseToRemove?.id) {
            await deleteCourseFromDb(courseToRemove.id);
        }
        const updated = selectedCourses.filter(c => c.code !== code);
        setSelectedCourses(updated);
        computeRequiredSGPA(updated, targetCGPA);
    };

    const handleTargetChange = (value: number) => {
        setTargetCGPA(value);
        computeRequiredSGPA(selectedCourses, value);
    };

    const generateConflictFreeSchedule = () => {
        let chosen: Course[] = [];
        let occupied: TimeBlock[] = [];

        for (const course of selectedCourses) {
            const blocks = getTimeBlocks(course.slot);
            if (!hasConflict(occupied, blocks)) {
                chosen.push(course);
                occupied = [...occupied, ...blocks];
            }
        }

        setOptimizedSchedule(chosen);
        setConflictMessage(chosen.length < selectedCourses.length
            ? "Some courses removed due to time conflicts."
            : "No conflicts detected. Schedule is valid.");
    };

    // Save to Supabase instead of localStorage
    const handleSave = async () => {
        if (!userProfile) {
            toast({
                title: "Error",
                description: "User profile not found",
                variant: "destructive",
            });
            return;
        }

        try {
            // Save all selected courses that aren't already in DB
            for (const course of selectedCourses) {
                if (!course.id) {
                    await addCourseToDb({
                        name: course.name,
                        code: course.code,
                        credits: course.credits,
                        slot: course.slot,
                        type: course.type,
                        semester_number: userProfile.current_semester,
                        is_current_semester: true,
                    });
                }
            }

            // Update user profile with target CGPA and career goal
            await updateUserProfile({
                target_cgpa: targetCGPA,
                career_goal: careerGoal,
            });

            toast({
                title: "Saved Successfully",
                description: "Your current semester courses have been saved to database",
            });

            navigate("/");
        } catch (error) {
            console.error("Error saving:", error);
            toast({
                title: "Error",
                description: "Failed to save courses to database",
                variant: "destructive",
            });
        }
    };

    const coreCourses = availableCourses.filter(c => c.type === "Core");
    const electiveCourses = availableCourses.filter(c => c.type === "Elective");

    const occupiedBlocks = selectedCourses.flatMap(course =>
        getTimeBlocks(course.slot)
    );

    const slotSafeElectives = electiveCourses.filter(course => {
        const blocks = getTimeBlocks(course.slot);
        return !hasConflict(occupiedBlocks, blocks);
    });

    const recommendedElectives = electiveCourses.filter(course =>
        careerElectiveMap[careerGoal]?.includes(course.name)
    );
    const fetchAIRecommendations = async (career: string) => {
        setLoadingRecommendations(true);
        setShowRecommendations(true);

        try {
            const courseNames = availableCourses.map(c => c.name);

            const recommendations = await getCareerCourseRecommendations(
                career,
                courseNames,
                branch,
                currentSemester
            );

            setAiRecommendations(recommendations.recommended);
            setAiExplanation(recommendations.explanation);

            toast({
                title: "AI Recommendations Ready! ✨",
                description: `Got ${recommendations.recommended.length} course suggestions for ${career}`,
            });
        } catch (error) {
            console.error('Error fetching AI recommendations:', error);
            toast({
                title: "Could not fetch recommendations",
                description: "Using career-based suggestions instead",
                variant: "destructive",
            });
            setShowRecommendations(false);
        } finally {
            setLoadingRecommendations(false);
        }
    };


    const otherElectives = slotSafeElectives.filter(course =>
        !careerElectiveMap[careerGoal]?.includes(course.name)
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-background px-6 py-10 flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background px-6 py-10 text-foreground">
            <div className="max-w-6xl mx-auto">
                {/* Back to Dashboard Button - Top Right */}
                <div className="flex justify-end mb-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/")}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Current Semester Planning</h1>
                    <p className="mt-2 text-muted-foreground">Set your CGPA goal and plan courses accordingly.</p>
                </div>
                <div className="mb-6">
                    <label className="block mb-2 font-medium">Target Career Path</label>
                    <div className="flex gap-2">
                        <select
                            value={careerGoal}
                            onChange={(e) => setCareerGoal(e.target.value)}
                            className="flex-1 h-11 px-3 border rounded-md bg-muted/50 focus:ring-1 focus:ring-primary"
                        >
                            {Object.keys(careerElectiveMap).map(career => (
                                <option key={career}>{career}</option>
                            ))}
                        </select>
                        <Button
                            onClick={() => fetchAIRecommendations(careerGoal)}
                            disabled={loadingRecommendations}
                            className="gap-2"
                            variant="outline"
                        >
                            {loadingRecommendations ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Getting AI Suggestions...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Get AI Suggestions
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                {showRecommendations && (
                    <div className="mb-8 p-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">AI-Powered Course Recommendations</h3>
                        </div>

                        {loadingRecommendations ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-3 text-muted-foreground">Analyzing your career path...</span>
                            </div>
                        ) : (
                            <>
                                {aiExplanation && (
                                    <div className="mb-4 p-4 rounded-lg bg-card/50 border border-border/50">
                                        <p className="text-sm leading-relaxed">{aiExplanation}</p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {aiRecommendations.map((rec, index) => {
                                        const course = availableCourses.find(c => c.name === rec.courseName);
                                        const isAlreadySelected = selectedCourses.some(c => c.name === rec.courseName);

                                        if (!course) return null;

                                        return (
                                            <div
                                                key={index}
                                                className="flex items-start justify-between p-4 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                            {index + 1}
                                                        </span>
                                                        <h4 className="font-semibold">{rec.courseName}</h4>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <TrendingUp className="h-3 w-3" />
                                                            Priority: {rec.priority}/10
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground ml-8 mb-2">{rec.reason}</p>
                                                    <p className="text-xs text-muted-foreground ml-8">
                                                        {course.code} • {course.credits} Credits • Slot {course.slot} • {course.type}
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => addCourse(course)}
                                                    disabled={isAlreadySelected}
                                                    size="sm"
                                                    variant={isAlreadySelected ? "outline" : "default"}
                                                    className="ml-4"
                                                >
                                                    {isAlreadySelected ? "Added ✓" : "Add Course"}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="p-5 rounded-xl border bg-card shadow-sm">
                        <p className="text-sm text-muted-foreground">Branch</p>
                        <p className="text-lg font-semibold">{branch}</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-card shadow-sm">
                        <p className="text-sm text-muted-foreground">Current Semester</p>
                        <p className="text-lg font-semibold">Semester {currentSemester}</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-card shadow-sm">
                        <p className="text-sm text-muted-foreground">Previous CGPA</p>
                        <p className="text-lg font-semibold text-primary">{previousCGPA}</p>
                    </div>
                </div>

                <div className="p-6 rounded-xl border bg-card shadow-sm mb-8">
                    <label className="block mb-2 font-medium">Target CGPA</label>
                    <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.01}
                        value={targetCGPA}
                        onChange={(e) => handleTargetChange(Number(e.target.value))}
                        className="h-11 w-48 px-3 rounded-md border bg-muted/50 focus:ring-1 focus:ring-primary"
                    />
                    <div className="mt-4 text-sm">
                        Minimum Required SGPA This Semester:{" "}
                        <span className="font-bold text-primary">{requiredSGPA}</span>
                    </div>
                </div>

                <div className="mb-6 p-6 rounded-xl border bg-card shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Add New Course</h3>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium">Course Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Data Structures"
                                id="courseName"
                                className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium">Course Code *</label>
                            <input
                                type="text"
                                placeholder="e.g., CS201"
                                id="courseCode"
                                className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium">Credits *</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                placeholder="e.g., 4"
                                id="courseCredits"
                                className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium">Slot *</label>
                            <input
                                type="text"
                                placeholder="e.g., A1"
                                id="courseSlot"
                                className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium">Course Type *</label>
                            <select
                                id="courseType"
                                className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-1 focus:ring-primary"
                            >
                                <option value="Core">Core</option>
                                <option value="Elective">Elective</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    const name = (document.getElementById('courseName') as HTMLInputElement)?.value;
                                    const code = (document.getElementById('courseCode') as HTMLInputElement)?.value;
                                    const credits = (document.getElementById('courseCredits') as HTMLInputElement)?.value;
                                    const slot = (document.getElementById('courseSlot') as HTMLInputElement)?.value;
                                    const type = (document.getElementById('courseType') as HTMLSelectElement)?.value;

                                    if (!name || !code || !credits || !slot) {
                                        toast({
                                            title: "Missing Information",
                                            description: "Please fill in all fields",
                                            variant: "destructive",
                                        });
                                        return;
                                    }

                                    addCourse({
                                        name,
                                        code,
                                        credits: Number(credits),
                                        slot,
                                        type: type as "Core" | "Elective",
                                    });

                                    // Clear inputs
                                    (document.getElementById('courseName') as HTMLInputElement).value = '';
                                    (document.getElementById('courseCode') as HTMLInputElement).value = '';
                                    (document.getElementById('courseCredits') as HTMLInputElement).value = '';
                                    (document.getElementById('courseSlot') as HTMLInputElement).value = '';
                                }}
                                className="w-full h-11 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
                            >
                                Add Course
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mt-6">
                    {selectedCourses.map(course => (
                        <div key={course.code} className="flex justify-between items-center p-4 rounded-xl border bg-card shadow-sm">
                            <div>
                                <p className="font-medium">{course.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {course.code} • {course.credits} Credits • Slot {course.slot} • {course.type}
                                </p>
                            </div>
                            <button onClick={() => removeCourse(course.code)} className="text-destructive text-sm hover:underline">
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-right">
                    <button onClick={handleSave} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
                        Save Current Semester →
                    </button>
                </div>

                <div className="mt-10 p-6 rounded-xl border bg-card shadow-sm">
                    <h2 className="text-lg font-semibold mb-3">Possible Grade Combinations to Reach Target CGPA</h2>
                    {gradePaths.length ? (
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                            {gradePaths.map((path, i) => <li key={i}>{path}</li>)}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No grade combinations yet.</p>
                    )}
                </div>

                <div className="mt-10 p-6 rounded-xl border bg-card shadow-sm">
                    <h2 className="text-lg font-semibold mb-3">Conflict-Free Weekly Timetable</h2>
                    <p className="text-sm text-muted-foreground mb-3">{conflictMessage}</p>

                    {optimizedSchedule.length ? (
                        <ul className="space-y-2 text-sm">
                            {optimizedSchedule.map(course => (
                                <li key={course.code}>
                                    <strong>{course.name}</strong> ({course.code}) — Slot {course.slot}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No valid schedule generated yet.</p>
                    )}
                </div>

            </div>
        </div>
    );
}