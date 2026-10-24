// src/contexts/ClassroomContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { classroomApi, ClassroomActivity } from '@/lib/classroomApi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ClassroomContextType {
  isConnected: boolean;
  isLoading: boolean;
  activities: ClassroomActivity[];
  upcomingAssignments: ClassroomActivity[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  lastSynced: Date | null;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export function ClassroomProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<ClassroomActivity[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<ClassroomActivity[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Check if user has previously connected Google Classroom
  useEffect(() => {
    if (user) {
      checkConnectionStatus();
    }
  }, [user]);

  const checkConnectionStatus = async () => {
    try {
      await classroomApi.initialize();
      const connected = classroomApi.isSignedIn();
      setIsConnected(connected);
      
      if (connected) {
        await loadActivities();
      }
    } catch (error) {
      console.error('Failed to check classroom connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async () => {
    try {
      setIsLoading(true);
      await classroomApi.signIn();
      
      const email = classroomApi.getUserEmail();
      
      // Save connection status to Supabase
      if (user && email) {
        await supabase
          .from('user_profiles')
          .update({ 
            google_classroom_email: email,
            classroom_connected: true,
            classroom_connected_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }
      
      setIsConnected(true);
      await loadActivities();
    } catch (error) {
      console.error('Failed to connect Google Classroom:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      await classroomApi.signOut();
      
      // Update Supabase
      if (user) {
        await supabase
          .from('user_profiles')
          .update({ 
            classroom_connected: false,
            google_classroom_email: null
          })
          .eq('user_id', user.id);
      }
      
      setIsConnected(false);
      setActivities([]);
      setUpcomingAssignments([]);
      setLastSynced(null);
    } catch (error) {
      console.error('Failed to disconnect Google Classroom:', error);
      throw error;
    }
  };

  const loadActivities = async () => {
    try {
      const [allActivities, upcoming] = await Promise.all([
        classroomApi.getAllActivities(14), // Last 2 weeks
        classroomApi.getUpcomingAssignments(7), // Next 7 days
      ]);
      
      setActivities(allActivities);
      setUpcomingAssignments(upcoming);
      setLastSynced(new Date());
    } catch (error) {
      console.error('Failed to load classroom activities:', error);
    }
  };

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      await loadActivities();
    } catch (error) {
      console.error('Failed to refresh activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  return (
    <ClassroomContext.Provider
      value={{
        isConnected,
        isLoading,
        activities,
        upcomingAssignments,
        connect,
        disconnect,
        refresh,
        lastSynced,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within ClassroomProvider');
  }
  return context;
}