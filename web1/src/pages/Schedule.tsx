import { useEffect, useState } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Clock, MapPin, User, Plus, Trash2, Calendar } from "lucide-react";
import { useCourses } from "../contexts/CoursesContext";
import { useToast } from "../hooks/use-toast";

type ScheduleItem = {
  id?: string;
  course_name: string;
  course_code: string;
  day: string;
  start_time: string;
  end_time: string;
  location: string;
  professor: string;
};

type DaySchedule = {
  day: string;
  classes: ScheduleItem[];
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Slot → Day & Time Mapping
const slotTimeMap: Record<string, { day: string; start: string; end: string }[]> = {
  A1: [
    { day: "Monday", start: "09:00", end: "10:00" },
    { day: "Wednesday", start: "09:00", end: "10:00" },
    { day: "Friday", start: "09:00", end: "10:00" },
  ],
  B1: [
    { day: "Tuesday", start: "10:00", end: "11:00" },
    { day: "Thursday", start: "10:00", end: "11:00" },
  ],
  C1: [
    { day: "Monday", start: "14:00", end: "15:00" },
    { day: "Wednesday", start: "14:00", end: "15:00" },
  ],
  D1: [
    { day: "Tuesday", start: "15:00", end: "16:00" },
    { day: "Thursday", start: "15:00", end: "16:00" },
  ],
  E1: [
    { day: "Monday", start: "11:00", end: "12:00" },
    { day: "Wednesday", start: "11:00", end: "12:00" },
  ],
  F1: [
    { day: "Tuesday", start: "09:00", end: "10:00" },
    { day: "Thursday", start: "09:00", end: "10:00" },
  ],
};

export default function Schedule() {
  const { getCurrentSemesterCourses } = useCourses();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClass, setNewClass] = useState<Partial<ScheduleItem>>({
    day: "Monday",
    start_time: "09:00",
    end_time: "10:00",
    location: "Academic Block",
    professor: "",
  });

  // Load schedule from current semester courses
  useEffect(() => {
    loadScheduleFromCourses();
  }, []);

  const loadScheduleFromCourses = () => {
    const courses = getCurrentSemesterCourses();
    const dayMap: Record<string, ScheduleItem[]> = {};

    courses.forEach((course) => {
      const slots = slotTimeMap[course.slot || ""] || [];

      slots.forEach(({ day, start, end }) => {
        if (!dayMap[day]) dayMap[day] = [];

        dayMap[day].push({
          id: `${course.id}-${day}`,
          course_name: course.name,
          course_code: course.code,
          day,
          start_time: start,
          end_time: end,
          location: "Academic Block",
          professor: "TBD",
        });
      });
    });

    // Load any custom classes from localStorage
    const customClasses = localStorage.getItem("customSchedule");
    if (customClasses) {
      const parsed: ScheduleItem[] = JSON.parse(customClasses);
      parsed.forEach((item) => {
        if (!dayMap[item.day]) dayMap[item.day] = [];
        dayMap[item.day].push(item);
      });
    }

    // Sort each day's classes by time
    Object.keys(dayMap).forEach((day) => {
      dayMap[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    const formatted = DAYS_OF_WEEK.map((day) => ({
      day,
      classes: dayMap[day] || [],
    })).filter((d) => d.classes.length > 0);

    setSchedule(formatted);
  };

  const handleAddClass = () => {
    if (!newClass.course_name || !newClass.professor) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const customClasses = localStorage.getItem("customSchedule");
    const existing: ScheduleItem[] = customClasses ? JSON.parse(customClasses) : [];

    const newItem: ScheduleItem = {
      id: `custom-${Date.now()}`,
      course_name: newClass.course_name!,
      course_code: newClass.course_code || "CUSTOM",
      day: newClass.day!,
      start_time: newClass.start_time!,
      end_time: newClass.end_time!,
      location: newClass.location || "TBD",
      professor: newClass.professor!,
    };

    existing.push(newItem);
    localStorage.setItem("customSchedule", JSON.stringify(existing));

    toast({
      title: "Class Added",
      description: "Your custom class has been added to the schedule",
    });

    setShowAddForm(false);
    setNewClass({
      day: "Monday",
      start_time: "09:00",
      end_time: "10:00",
      location: "Academic Block",
      professor: "",
    });

    loadScheduleFromCourses();
  };

  const handleDeleteClass = (classId: string) => {
    const customClasses = localStorage.getItem("customSchedule");
    if (customClasses) {
      const existing: ScheduleItem[] = JSON.parse(customClasses);
      const filtered = existing.filter((item) => item.id !== classId);
      localStorage.setItem("customSchedule", JSON.stringify(filtered));

      toast({
        title: "Class Removed",
        description: "The class has been removed from your schedule",
      });

      loadScheduleFromCourses();
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Class Schedule</h1>
              <p className="text-muted-foreground">
                Your weekly class schedule at a glance
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" />
              Add Custom Class
            </button>
          </div>

          {/* Add Class Form */}
          {showAddForm && (
            <Card className="mb-6 border-2 border-primary">
              <CardHeader>
                <CardTitle>Add Custom Class</CardTitle>
                <CardDescription>
                  Add extra classes, labs, or activities to your schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Class Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Physics Lab"
                      value={newClass.course_name || ""}
                      onChange={(e) =>
                        setNewClass({ ...newClass, course_name: e.target.value })
                      }
                      className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Course Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., PHY101"
                      value={newClass.course_code || ""}
                      onChange={(e) =>
                        setNewClass({ ...newClass, course_code: e.target.value })
                      }
                      className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Day *</label>
                    <select
                      value={newClass.day}
                      onChange={(e) =>
                        setNewClass({ ...newClass, day: e.target.value })
                      }
                      className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-2 focus:ring-primary"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={newClass.start_time}
                      onChange={(e) =>
                        setNewClass({ ...newClass, start_time: e.target.value })
                      }
                      className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={newClass.end_time}
                      onChange={(e) =>
                        setNewClass({ ...newClass, end_time: e.target.value })
                      }
                      className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Room 301"
                      value={newClass.location}
                      onChange={(e) =>
                        setNewClass({ ...newClass, location: e.target.value })
                      }
                      className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Professor *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Dr. Smith"
                      value={newClass.professor}
                      onChange={(e) =>
                        setNewClass({ ...newClass, professor: e.target.value })
                      }
                      className="w-full h-11 px-3 border rounded-md bg-muted/50 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleAddClass}
                    className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
                  >
                    Add Class
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 rounded-lg border hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Grid */}
          <div className="space-y-6">
            {schedule.length > 0 ? (
              schedule.map((daySchedule) => (
                <Card key={daySchedule.day}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {daySchedule.day}
                        </CardTitle>
                        <CardDescription>
                          {daySchedule.classes.length}{" "}
                          {daySchedule.classes.length === 1 ? "class" : "classes"} scheduled
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {daySchedule.classes.map((classItem, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors relative group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">
                                {classItem.course_name}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                {classItem.course_code}
                              </p>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {formatTime(classItem.start_time)} -{" "}
                                    {formatTime(classItem.end_time)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{classItem.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{classItem.professor}</span>
                                </div>
                              </div>
                            </div>

                            {/* Delete button for custom classes */}
                            {classItem.id?.startsWith("custom-") && (
                              <button
                                onClick={() => handleDeleteClass(classItem.id!)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                                title="Delete custom class"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Schedule Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Your enrolled courses will automatically appear here, or you can add custom classes.
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
                  >
                    Add Your First Class
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}