import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoalsProvider } from "@/contexts/GoalsContext";
import { CoursesProvider } from "@/contexts/CoursesContext";
import { ClassroomProvider } from "@/contexts/ClassroomContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import GPATracker from "./pages/GPATracker";
import Schedule from "./pages/Schedule";
import Goals from "./pages/Goals";
import Courses from "./pages/Courses";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import FocusMode from "./pages/FocusMode";
import PreviousSemester from "./pages/PreviousSemester";
import CurrentSemester from "./pages/CurrentSemester";
import OnboardingSetup from "./pages/OnboardingSetup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <GoalsProvider>
          <CoursesProvider>
            <ClassroomProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />

                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <OnboardingSetup />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/previous-semester"
                    element={
                      <ProtectedRoute>
                        <PreviousSemester />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/current-semester"
                    element={
                      <ProtectedRoute>
                        <CurrentSemester />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/gpa-tracker"
                    element={
                      <ProtectedRoute>
                        <GPATracker />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/focus"
                    element={
                      <ProtectedRoute>
                        <FocusMode />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/schedule"
                    element={
                      <ProtectedRoute>
                        <Schedule />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/goals"
                    element={
                      <ProtectedRoute>
                        <Goals />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/courses"
                    element={
                      <ProtectedRoute>
                        <Courses />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ClassroomProvider>
          </CoursesProvider>
        </GoalsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;