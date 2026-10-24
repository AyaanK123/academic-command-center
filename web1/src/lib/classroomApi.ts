// src/lib/classroomApi.ts
import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOCS = ['https://classroom.googleapis.com/$discovery/rest?version=v1'];
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly'
].join(' ');

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  courseState: string;
  teacherFolder?: {
    id: string;
    title: string;
  };
}

export interface CourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  materials?: any[];
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
  maxPoints?: number;
  workType: string; // ASSIGNMENT, SHORT_ANSWER_QUESTION, MULTIPLE_CHOICE_QUESTION
  state: string;
  creationTime: string;
  updateTime: string;
  associatedWithDeveloper?: boolean;
}

export interface StudentSubmission {
  id: string;
  courseWorkId: string;
  courseId: string;
  userId: string;
  state: string; // NEW, CREATED, TURNED_IN, RETURNED, RECLAIMED_BY_STUDENT
  assignedGrade?: number;
  draftGrade?: number;
  late?: boolean;
  submissionHistory?: Array<{
    stateHistory?: {
      state: string;
      stateTimestamp: string;
    };
  }>;
  creationTime: string;
  updateTime: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  text: string;
  materials?: any[];
  state: string;
  creationTime: string;
  updateTime: string;
  scheduledTime?: string;
}

export interface ClassroomActivity {
  id: string;
  type: 'assignment' | 'announcement' | 'grade';
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate?: Date;
  submissionState?: string;
  grade?: number;
  maxPoints?: number;
  isLate?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class ClassroomApiService {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          });
          
          this.isInitialized = true;
          resolve();
        } catch (error) {
          console.error('Failed to initialize Google API:', error);
          reject(error);
        }
      });
    });

    return this.initPromise;
  }

  async signIn(): Promise<void> {
    await this.initialize();
    const auth = gapi.auth2.getAuthInstance();
    
    if (!auth.isSignedIn.get()) {
      await auth.signIn({
        prompt: 'select_account'
      });
    }
  }

  async signOut(): Promise<void> {
    const auth = gapi.auth2.getAuthInstance();
    if (auth && auth.isSignedIn.get()) {
      await auth.signOut();
    }
  }

  isSignedIn(): boolean {
    if (!this.isInitialized) return false;
    const auth = gapi.auth2.getAuthInstance();
    return auth ? auth.isSignedIn.get() : false;
  }

  getUserEmail(): string | null {
    if (!this.isSignedIn()) return null;
    const auth = gapi.auth2.getAuthInstance();
    const user = auth.currentUser.get();
    return user.getBasicProfile().getEmail();
  }

  async getCourses(): Promise<ClassroomCourse[]> {
    await this.initialize();
    
    try {
      const response = await gapi.client.request({
        path: 'https://classroom.googleapis.com/v1/courses',
        params: {
          courseStates: ['ACTIVE'],
          pageSize: 50,
        },
      });

      return response.result.courses || [];
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      return [];
    }
  }

  async getCourseWork(courseId: string): Promise<CourseWork[]> {
    await this.initialize();

    try {
      const response = await gapi.client.request({
        path: `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`,
        params: {
          pageSize: 100,
          orderBy: 'updateTime desc',
        },
      });

      return response.result.courseWork || [];
    } catch (error) {
      console.error(`Failed to fetch coursework for ${courseId}:`, error);
      return [];
    }
  }

  async getStudentSubmissions(
    courseId: string, 
    courseWorkId: string
  ): Promise<StudentSubmission[]> {
    await this.initialize();

    try {
      const response = await gapi.client.request({
        path: `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`,
        params: {
          pageSize: 100,
        },
      });

      return response.result.studentSubmissions || [];
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      return [];
    }
  }

  async getMySubmission(
    courseId: string, 
    courseWorkId: string
  ): Promise<StudentSubmission | null> {
    const submissions = await this.getStudentSubmissions(courseId, courseWorkId);
    const auth = gapi.auth2.getAuthInstance();
    const userId = auth.currentUser.get().getId();
    
    return submissions.find(s => s.userId === userId) || null;
  }

  async getAnnouncements(courseId: string): Promise<Announcement[]> {
    await this.initialize();

    try {
      const response = await gapi.client.request({
        path: `https://classroom.googleapis.com/v1/courses/${courseId}/announcements`,
        params: {
          pageSize: 50,
          orderBy: 'updateTime desc',
        },
      });

      return response.result.announcements || [];
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      return [];
    }
  }

  async getAllActivities(daysBack: number = 14): Promise<ClassroomActivity[]> {
    const courses = await this.getCourses();
    const activities: ClassroomActivity[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    for (const course of courses) {
      // Fetch coursework
      const courseWork = await this.getCourseWork(course.id);
      
      for (const work of courseWork) {
        const updateTime = new Date(work.updateTime);
        
        // Only include recent activities
        if (updateTime >= cutoffDate) {
          const submission = await this.getMySubmission(course.id, work.id);
          
          let dueDate: Date | undefined;
          if (work.dueDate) {
            dueDate = new Date(
              work.dueDate.year,
              work.dueDate.month - 1,
              work.dueDate.day,
              work.dueTime?.hours || 23,
              work.dueTime?.minutes || 59
            );
          }

          // Add assignment activity
          activities.push({
            id: `work-${course.id}-${work.id}`,
            type: 'assignment',
            courseId: course.id,
            courseName: course.name,
            title: work.title,
            description: work.description || '',
            dueDate,
            submissionState: submission?.state,
            grade: submission?.assignedGrade,
            maxPoints: work.maxPoints,
            isLate: submission?.late,
            createdAt: new Date(work.creationTime),
            updatedAt: new Date(work.updateTime),
          });

          // Add grade activity if graded
          if (submission?.state === 'RETURNED' && submission.assignedGrade !== undefined) {
            activities.push({
              id: `grade-${course.id}-${work.id}`,
              type: 'grade',
              courseId: course.id,
              courseName: course.name,
              title: work.title,
              description: `Graded: ${submission.assignedGrade}/${work.maxPoints}`,
              grade: submission.assignedGrade,
              maxPoints: work.maxPoints,
              createdAt: new Date(submission.updateTime),
              updatedAt: new Date(submission.updateTime),
            });
          }
        }
      }

      // Fetch announcements
      const announcements = await this.getAnnouncements(course.id);
      
      for (const announcement of announcements) {
        const creationTime = new Date(announcement.creationTime);
        
        if (creationTime >= cutoffDate) {
          activities.push({
            id: `announcement-${course.id}-${announcement.id}`,
            type: 'announcement',
            courseId: course.id,
            courseName: course.name,
            title: `${course.name} Announcement`,
            description: announcement.text,
            createdAt: creationTime,
            updatedAt: new Date(announcement.updateTime),
          });
        }
      }
    }

    // Sort by most recent first
    return activities.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getUpcomingAssignments(daysAhead: number = 7): Promise<ClassroomActivity[]> {
    const courses = await this.getCourses();
    const assignments: ClassroomActivity[] = [];
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    for (const course of courses) {
      const courseWork = await this.getCourseWork(course.id);
      
      for (const work of courseWork) {
        if (work.dueDate) {
          const dueDate = new Date(
            work.dueDate.year,
            work.dueDate.month - 1,
            work.dueDate.day,
            work.dueTime?.hours || 23,
            work.dueTime?.minutes || 59
          );

          // Only include future assignments within the range
          if (dueDate >= now && dueDate <= futureDate) {
            const submission = await this.getMySubmission(course.id, work.id);
            
            // Only include if not yet submitted
            if (!submission || submission.state === 'NEW' || submission.state === 'CREATED') {
              assignments.push({
                id: `upcoming-${course.id}-${work.id}`,
                type: 'assignment',
                courseId: course.id,
                courseName: course.name,
                title: work.title,
                description: work.description || '',
                dueDate,
                submissionState: submission?.state,
                maxPoints: work.maxPoints,
                createdAt: new Date(work.creationTime),
                updatedAt: new Date(work.updateTime),
              });
            }
          }
        }
      }
    }

    // Sort by due date
    return assignments.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }
}

export const classroomApi = new ClassroomApiService();