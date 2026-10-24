import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type DbCourse = Database['public']['Tables']['courses']['Row'];

export interface Course {
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
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id?: string;
  user_id?: string;
  branch: string;
  current_semester: number;
  previous_cgpa: number;
  target_cgpa: number;
  career_goal?: string | null;
  total_credits_earned?: number;
  created_at?: string;
  updated_at?: string;
}

interface CoursesContextType {
  courses: Course[];
  userProfile: UserProfile | null;
  loading: boolean;
  addCourse: (course: Omit<Course, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  createUserProfile: (profile: Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  getCurrentSemesterCourses: () => Course[];
  getPreviousSemesterCourses: () => Course[];
  getCompletedCourses: () => Course[];
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
          setLoading(false);
        } else if (data) {
          setUserProfile({
            id: data.id,
            user_id: data.user_id,
            branch: data.branch,
            current_semester: data.current_semester,
            previous_cgpa: data.previous_cgpa,
            target_cgpa: data.target_cgpa,
            career_goal: data.career_goal,
            total_credits_earned: data.total_credits_earned,
            created_at: data.created_at,
            updated_at: data.updated_at,
          });
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return;
        }

        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('semester_number', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching courses:', error);
        } else if (data) {
          const mappedCourses: Course[] = data.map(dbCourse => ({
            id: dbCourse.id,
            name: dbCourse.name,
            code: dbCourse.code,
            credits: dbCourse.credits,
            slot: dbCourse.slot,
            type: dbCourse.type as "Core" | "Elective",
            semester_number: dbCourse.semester_number,
            is_current_semester: dbCourse.is_current_semester,
            grade: dbCourse.grade,
            is_completed: dbCourse.is_completed,
            user_id: dbCourse.user_id,
            created_at: dbCourse.created_at,
            updated_at: dbCourse.updated_at,
          }));
          setCourses(mappedCourses);
        }
      } catch (error) {
        console.error('Error in fetchCourses:', error);
      }
    };

    fetchCourses();
  }, []);

  const addCourse = async (newCourse: Omit<Course, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        return;
      }

      const dbCourse = {
        user_id: user.id,
        name: newCourse.name,
        code: newCourse.code,
        credits: newCourse.credits,
        slot: newCourse.slot,
        type: newCourse.type,
        semester_number: newCourse.semester_number || userProfile?.current_semester || 1,
        is_current_semester: newCourse.is_current_semester || false,
        grade: newCourse.grade || null,
        is_completed: newCourse.is_completed || false,
      };

      const { data, error } = await supabase
        .from('courses')
        .insert([dbCourse])
        .select();
      
      if (error) {
        console.error('Error adding course:', error);
      } else if (data && data[0]) {
        const newDbCourse = data[0];
        const mappedCourse: Course = {
          id: newDbCourse.id,
          name: newDbCourse.name,
          code: newDbCourse.code,
          credits: newDbCourse.credits,
          slot: newDbCourse.slot,
          type: newDbCourse.type as "Core" | "Elective",
          semester_number: newDbCourse.semester_number,
          is_current_semester: newDbCourse.is_current_semester,
          grade: newDbCourse.grade,
          is_completed: newDbCourse.is_completed,
          user_id: newDbCourse.user_id,
          created_at: newDbCourse.created_at,
          updated_at: newDbCourse.updated_at,
        };
        setCourses(prev => [mappedCourse, ...prev]);
      }
    } catch (error) {
      console.error('Error in addCourse:', error);
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    try {
      const dbUpdates: Partial<DbCourse> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.code !== undefined) dbUpdates.code = updates.code;
      if (updates.credits !== undefined) dbUpdates.credits = updates.credits;
      if (updates.slot !== undefined) dbUpdates.slot = updates.slot;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.semester_number !== undefined) dbUpdates.semester_number = updates.semester_number;
      if (updates.is_current_semester !== undefined) dbUpdates.is_current_semester = updates.is_current_semester;
      if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
      if (updates.is_completed !== undefined) dbUpdates.is_completed = updates.is_completed;

      const { error } = await supabase
        .from('courses')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating course:', error);
      } else {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      }
    } catch (error) {
      console.error('Error in updateCourse:', error);
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting course:', error);
      } else {
        setCourses(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Error in deleteCourse:', error);
    }
  };

  const createUserProfile = async (profile: Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        return;
      }

      const { data, error } = await supabase
        .from('user_profile')
        .insert([{
          user_id: user.id,
          branch: profile.branch,
          current_semester: profile.current_semester || 1,
          previous_cgpa: profile.previous_cgpa || 0,
          target_cgpa: profile.target_cgpa || 9,
          career_goal: profile.career_goal || null,
          total_credits_earned: profile.total_credits_earned || 0,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
      } else if (data) {
        setUserProfile({
          id: data.id,
          user_id: data.user_id,
          branch: data.branch,
          current_semester: data.current_semester,
          previous_cgpa: data.previous_cgpa,
          target_cgpa: data.target_cgpa,
          career_goal: data.career_goal,
          total_credits_earned: data.total_credits_earned,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        return;
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Create new profile with updates
        await createUserProfile({
          branch: updates.branch || 'CSE',
          current_semester: updates.current_semester || 1,
          previous_cgpa: updates.previous_cgpa || 0,
          target_cgpa: updates.target_cgpa || 9,
          career_goal: updates.career_goal || null,
          total_credits_earned: updates.total_credits_earned || 0,
        });
      } else {
        // Update existing profile
        const { error } = await supabase
          .from('user_profile')
          .update(updates)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error updating user profile:', error);
        } else {
          setUserProfile(prev => prev ? { ...prev, ...updates } : null);
        }
      }
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
    }
  };

  const getCurrentSemesterCourses = () => {
    return courses.filter(c => c.is_current_semester);
  };

  const getPreviousSemesterCourses = () => {
    const prevSemester = (userProfile?.current_semester || 1) - 1;
    return courses.filter(c => 
      !c.is_current_semester && 
      c.semester_number === prevSemester
    );
  };

  const getCompletedCourses = () => {
    return courses.filter(c => c.is_completed);
  };

  return (
    <CoursesContext.Provider value={{
      courses,
      userProfile,
      loading,
      addCourse,
      updateCourse,
      deleteCourse,
      updateUserProfile,
      createUserProfile,
      getCurrentSemesterCourses,
      getPreviousSemesterCourses,
      getCompletedCourses,
    }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CoursesContext);
  if (context === undefined) {
    throw new Error("useCourses must be used within a CoursesProvider");
  }
  return context;
}