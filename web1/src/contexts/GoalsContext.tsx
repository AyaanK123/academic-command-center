import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

// Use the auto-generated type from Supabase
type DbGoal = Database['public']['Tables']['goals']['Row'];

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  deadline: string;
  status: "In Progress" | "Completed" | "Not Started";
  priority: "high" | "medium" | "low";
  estimatedTime: string;
  course?: string;
  archived?: boolean;
  aiRating?: {
    urgency: number;
    importance: number;
    difficulty: number;
    suggestion: string;
  };
  user_id?: string;
  created_at?: string;
}

interface GoalsContextType {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  getHighPriorityTasks: () => Goal[];
  loading: boolean;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH: Load goals from Supabase on mount
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching goals:', error);
        } else if (data) {
          // Map database fields to Goal interface
          const mappedGoals: Goal[] = data.map(dbGoal => ({
            id: dbGoal.id,
            title: dbGoal.title,
            description: dbGoal.description || '',
            category: dbGoal.category || 'Other',
            progress: dbGoal.progress || 0,
            deadline: dbGoal.deadline,
            status: (dbGoal.status as Goal['status']) || 'Not Started',
            priority: (dbGoal.priority as Goal['priority']) || 'medium',
            estimatedTime: dbGoal.estimated_time || '',
            course: dbGoal.course || undefined,
            archived: dbGoal.archived || false,
            aiRating: dbGoal.ai_rating as Goal['aiRating'],
            user_id: dbGoal.user_id,
            created_at: dbGoal.created_at
          }));
          setGoals(mappedGoals);
        }
      } catch (error) {
        console.error('Error in fetchGoals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  // ADD: Save to Supabase
  const addGoal = async (newGoal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        return;
      }

      // Map to database schema
      const dbGoal = {
        user_id: user.id,
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        progress: newGoal.progress,
        deadline: newGoal.deadline,
        status: newGoal.status,
        priority: newGoal.priority,
        estimated_time: newGoal.estimatedTime,
        course: newGoal.course,
        archived: newGoal.archived || false,
        ai_rating: newGoal.aiRating
      };

      const { data, error } = await supabase
        .from('goals')
        .insert([dbGoal])
        .select();
      
      if (error) {
        console.error('Error adding goal:', error);
      } else if (data && data[0]) {
        const newDbGoal = data[0];
        const mappedGoal: Goal = {
          id: newDbGoal.id,
          title: newDbGoal.title,
          description: newDbGoal.description || '',
          category: newDbGoal.category || 'Other',
          progress: newDbGoal.progress || 0,
          deadline: newDbGoal.deadline,
          status: (newDbGoal.status as Goal['status']) || 'Not Started',
          priority: (newDbGoal.priority as Goal['priority']) || 'medium',
          estimatedTime: newDbGoal.estimated_time || '',
          course: newDbGoal.course || undefined,
          archived: newDbGoal.archived || false,
          aiRating: newDbGoal.ai_rating as Goal['aiRating'],
          user_id: newDbGoal.user_id,
          created_at: newDbGoal.created_at
        };
        setGoals(prev => [mappedGoal, ...prev]);
      }
    } catch (error) {
      console.error('Error in addGoal:', error);
    }
  };

  // UPDATE
  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      // Map to database schema
      const dbUpdates: Partial<DbGoal> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.estimatedTime !== undefined) dbUpdates.estimated_time = updates.estimatedTime;
      if (updates.course !== undefined) dbUpdates.course = updates.course;
      if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
      if (updates.aiRating !== undefined) dbUpdates.ai_rating = updates.aiRating as any;

      const { error } = await supabase
        .from('goals')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating goal:', error);
      } else {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
      }
    } catch (error) {
      console.error('Error in updateGoal:', error);
    }
  };

  // DELETE
  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting goal:', error);
      } else {
        setGoals(prev => prev.filter(g => g.id !== id));
      }
    } catch (error) {
      console.error('Error in deleteGoal:', error);
    }
  };

  const getHighPriorityTasks = () => {
    return goals
      .filter(g => g.status !== "Completed" && !g.archived)
      .filter(g => g.priority === "high" || g.priority === "medium")
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .slice(0, 4);
  };

  return (
    <GoalsContext.Provider value={{ 
      goals, 
      setGoals, 
      addGoal, 
      updateGoal, 
      deleteGoal,
      getHighPriorityTasks,
      loading
    }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalsProvider");
  }
  return context;
}