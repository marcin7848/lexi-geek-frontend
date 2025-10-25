import { TaskType, RecentActivity, TaskSettings, TaskSchedule, UserStats, UserData } from "@/types/dashboard";
import { languageService } from "./languageService";

export type { TaskType, RecentActivity, TaskSettings, TaskSchedule, UserStats, UserData };

const TASKS_KEY = "daily_tasks";
const RECENT_ACTIVITY_KEY = "recent_activity";
const TASK_SETTINGS_KEY = "task_settings";
const TASK_SCHEDULE_KEY = "task_schedule";
const USER_STATS_KEY = "user_stats";
const USER_DATA_KEY = "user_data";

const calculateStarsReward = (maximum: number, schedule: TaskSchedule): number => {
  let baseStars = Math.ceil(maximum / 10);
  
  // Multiply based on frequency
  switch (schedule.frequency) {
    case 'daily':
      baseStars *= 1;
      break;
    case 'every_n_days':
      baseStars *= Math.max(1, 1 / (schedule.frequencyValue || 1));
      break;
    case 'weekly':
      baseStars *= 0.5;
      break;
    case 'monthly':
      baseStars *= 0.2;
      break;
  }
  
  return Math.max(1, Math.ceil(baseStars));
};

export const dashboardService = {
  getUserData: async (): Promise<UserData> => {
    const stored = localStorage.getItem(USER_DATA_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return { stars: 0, lastTaskReload: Date.now() };
  },

  updateUserData: async (data: Partial<UserData>): Promise<UserData> => {
    const current = await dashboardService.getUserData();
    const updated = { ...current, ...data };
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(updated));
    return updated;
  },

  addStars: async (amount: number): Promise<UserData> => {
    const current = await dashboardService.getUserData();
    return dashboardService.updateUserData({ stars: current.stars + amount });
  },

  getDailyTasks: async (): Promise<TaskType[]> => {
    const stored = localStorage.getItem(TASKS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return dashboardService.generateTasks();
  },

  generateTasks: async (): Promise<TaskType[]> => {
    const languages = await languageService.getAll();
    const settings = await dashboardService.getTaskSettings();
    const schedule = await dashboardService.getTaskSchedule();
    const tasks: TaskType[] = [];

    const taskTypes: Array<'repeat_dictionary' | 'repeat_exercise' | 'add_dictionary' | 'add_exercise'> = [
      'repeat_dictionary',
      'repeat_exercise',
      'add_dictionary',
      'add_exercise'
    ];

    languages.forEach(lang => {
      const langSettings = settings.find(s => s.languageId === lang.id);
      
      taskTypes.forEach(taskType => {
        const setting = langSettings?.[taskType] || {
          enabled: true,
          maximum: taskType.includes('repeat') ? 30 : 10
        };

        // Randomly include tasks (70% chance)
        if (setting.enabled && Math.random() > 0.3) {
          tasks.push({
            id: `${lang.id}-${taskType}`,
            type: taskType,
            languageId: lang.id,
            languageName: lang.name,
            current: 0,
            maximum: setting.maximum,
            starsReward: calculateStarsReward(setting.maximum, schedule)
          });
        }
      });
    });

    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    await dashboardService.updateUserData({ lastTaskReload: Date.now() });
    return tasks;
  },

  updateTaskProgress: async (taskId: string, progress: number): Promise<void> => {
    const tasks = await dashboardService.getDailyTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      task.current = Math.min(progress, task.maximum);
      
      // Award stars if task completed
      if (task.current >= task.maximum && task.current - progress < task.maximum) {
        await dashboardService.addStars(task.starsReward);
      }
      
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }
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
    const stored = localStorage.getItem(TASK_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Generate default settings for all languages
    const languages = await languageService.getAll();
    return languages.map(lang => ({
      languageId: lang.id,
      repeat_dictionary: { enabled: true, maximum: 30 },
      repeat_exercise: { enabled: true, maximum: 30 },
      add_dictionary: { enabled: true, maximum: 10 },
      add_exercise: { enabled: true, maximum: 10 }
    }));
  },

  updateTaskSettings: async (settings: TaskSettings[]): Promise<void> => {
    localStorage.setItem(TASK_SETTINGS_KEY, JSON.stringify(settings));
  },

  getTaskSchedule: async (): Promise<TaskSchedule> => {
    const stored = localStorage.getItem(TASK_SCHEDULE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      hour: 0,
      minute: 0,
      frequency: 'daily'
    };
  },

  updateTaskSchedule: async (schedule: TaskSchedule): Promise<void> => {
    localStorage.setItem(TASK_SCHEDULE_KEY, JSON.stringify(schedule));
  },

  getUserStats: async (): Promise<UserStats[]> => {
    const stored = localStorage.getItem(USER_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Generate mock data for the last 30 days
    const stats: UserStats[] = [];
    const languages = await languageService.getAll();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const languageBreakdown: Record<string, any> = {};
      languages.forEach(lang => {
        languageBreakdown[lang.id] = {
          repeatDictionary: Math.floor(Math.random() * 20),
          repeatExercise: Math.floor(Math.random() * 15),
          addDictionary: Math.floor(Math.random() * 5),
          addExercise: Math.floor(Math.random() * 5)
        };
      });
      
      const totalRepeatDict = Object.values(languageBreakdown).reduce((sum: number, lb: any) => sum + lb.repeatDictionary, 0);
      const totalRepeatExer = Object.values(languageBreakdown).reduce((sum: number, lb: any) => sum + lb.repeatExercise, 0);
      const totalAddDict = Object.values(languageBreakdown).reduce((sum: number, lb: any) => sum + lb.addDictionary, 0);
      const totalAddExer = Object.values(languageBreakdown).reduce((sum: number, lb: any) => sum + lb.addExercise, 0);
      
      stats.push({
        date: dateStr,
        repeatDictionary: totalRepeatDict,
        repeatExercise: totalRepeatExer,
        addDictionary: totalAddDict,
        addExercise: totalAddExer,
        stars: Math.floor(Math.random() * 10),
        languageBreakdown
      });
    }
    
    localStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
    return stats;
  },

  addDailyStats: async (
    languageId: string,
    type: 'repeatDictionary' | 'repeatExercise' | 'addDictionary' | 'addExercise',
    amount: number
  ): Promise<void> => {
    const stats = await dashboardService.getUserStats();
    const today = new Date().toISOString().split('T')[0];
    
    let todayStats = stats.find(s => s.date === today);
    if (!todayStats) {
      todayStats = {
        date: today,
        repeatDictionary: 0,
        repeatExercise: 0,
        addDictionary: 0,
        addExercise: 0,
        stars: 0,
        languageBreakdown: {}
      };
      stats.push(todayStats);
    }
    
    todayStats[type] += amount;
    
    if (!todayStats.languageBreakdown[languageId]) {
      todayStats.languageBreakdown[languageId] = {
        repeatDictionary: 0,
        repeatExercise: 0,
        addDictionary: 0,
        addExercise: 0
      };
    }
    todayStats.languageBreakdown[languageId][type] += amount;
    
    localStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
  }
};
