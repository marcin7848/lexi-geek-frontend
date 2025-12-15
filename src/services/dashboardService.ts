import { TaskType, RecentActivity, TaskSettings, TaskSchedule, UserData } from "@/types/dashboard";
import { accountService } from "./accountService";
import { tasksService } from "./tasksService";
import { activityService } from "./activityService";

export type { TaskType, RecentActivity, TaskSettings, TaskSchedule, UserData };

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
    return await activityService.getRecentActivities(50);
  },

  addActivity: async (activity: Omit<RecentActivity, 'id' | 'created'>): Promise<void> => {
    // Note: This is a placeholder. In a real implementation, you would call a backend endpoint
    // to create a new activity. For now, we just clear the cache to trigger a refresh.
    console.log('Adding activity (backend endpoint needed):', activity);
    activityService.clearCache();
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
