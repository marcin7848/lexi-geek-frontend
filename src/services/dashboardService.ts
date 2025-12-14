import { TaskType, RecentActivity, TaskSettings, TaskSchedule, UserData } from "@/types/dashboard";
import { languageService } from "./languageService";
import { accountService } from "./accountService";
import { tasksService } from "./tasksService";

export type { TaskType, RecentActivity, TaskSettings, TaskSchedule, UserData };

const RECENT_ACTIVITY_KEY = "recent_activity";
const LAST_TASK_RELOAD_KEY = "last_task_reload";

export const dashboardService = {
  getUserData: async (): Promise<UserData> => {
    try {
      const stars = await accountService.getStars();
      const stored = localStorage.getItem(LAST_TASK_RELOAD_KEY);
      const lastTaskReload = stored ? parseInt(stored, 10) : Date.now();
      return { stars, lastTaskReload };
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Fallback to 0 stars if API call fails
      const stored = localStorage.getItem(LAST_TASK_RELOAD_KEY);
      const lastTaskReload = stored ? parseInt(stored, 10) : Date.now();
      return { stars: 0, lastTaskReload };
    }
  },

  updateUserData: async (data: Partial<UserData>): Promise<UserData> => {
    // Only update lastTaskReload in localStorage since stars come from API
    if (data.lastTaskReload !== undefined) {
      localStorage.setItem(LAST_TASK_RELOAD_KEY, String(data.lastTaskReload));
    }
    // Fetch fresh data from API
    return dashboardService.getUserData();
  },

  addStars: async (amount: number): Promise<UserData> => {
    // Note: This is a placeholder. In the future, you should call a backend endpoint to add stars
    // For now, we just refetch the current stars from the API
    console.log(`Adding ${amount} stars (backend update needed)`);
    return dashboardService.getUserData();
  },

  getDailyTasks: async (): Promise<TaskType[]> => {
    return await tasksService.getTasks();
  },

  generateTasks: async (): Promise<TaskType[]> => {
    localStorage.setItem(LAST_TASK_RELOAD_KEY, String(Date.now()));
    return await tasksService.reloadTasks();
  },

  updateTaskProgress: async (taskId: string, progress: number): Promise<void> => {
    await tasksService.updateTaskProgress(taskId, progress);
  },

  getRecentActivity: async (): Promise<RecentActivity[]> => {
    const stored = localStorage.getItem(RECENT_ACTIVITY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Generate mock data
    const languages = await languageService.getAll();
    const activities: RecentActivity[] = [];
    const activityTypes: Array<'repeat' | 'add'> = ['repeat', 'add'];
    
    // Generate 20 random activities over the past 7 days
    for (let i = 0; i < 20; i++) {
      const randomLang = languages[Math.floor(Math.random() * languages.length)];
      const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const randomHoursAgo = Math.floor(Math.random() * 168); // 7 days in hours
      const timestamp = Date.now() - (randomHoursAgo * 60 * 60 * 1000);
      
      activities.push({
        id: `activity-${i}`,
        languageId: randomLang.id,
        languageName: randomLang.name,
        categoryId: `cat-${i}`,
        categoryName: `Category ${i % 5 + 1}`,
        timestamp,
        type: randomType
      });
    }
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    localStorage.setItem(RECENT_ACTIVITY_KEY, JSON.stringify(activities));
    return activities;
  },

  addActivity: async (activity: Omit<RecentActivity, 'id' | 'timestamp'>): Promise<void> => {
    const activities = await dashboardService.getRecentActivity();
    activities.unshift({
      ...activity,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    });
    
    // Keep only last 50 activities
    const trimmed = activities.slice(0, 50);
    localStorage.setItem(RECENT_ACTIVITY_KEY, JSON.stringify(trimmed));
  },

  getTaskSettings: async (): Promise<TaskSettings[]> => {
    return await tasksService.getTaskSettings();
  },

  updateTaskSettings: async (settings: TaskSettings[]): Promise<void> => {
    await tasksService.updateTaskSettings(settings);
  },

  getTaskSchedule: async (): Promise<TaskSchedule> => {
    return await tasksService.getTaskSchedule();
  },

  updateTaskSchedule: async (schedule: TaskSchedule): Promise<void> => {
    await tasksService.updateTaskSchedule(schedule);
  }
};
