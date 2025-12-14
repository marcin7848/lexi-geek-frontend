export interface TaskType {
  id: string;
  type: 'repeat_dictionary' | 'repeat_exercise' | 'add_dictionary' | 'add_exercise';
  languageId: string;
  languageName: string;
  current: number;
  maximum: number;
  starsReward: number;
}

export interface RecentActivity {
  id: string;
  languageId: string;
  languageName: string;
  categoryId: string;
  categoryName: string;
  timestamp: number;
  type: 'repeat' | 'add';
}

export interface TaskSettings {
  languageId: string;
  repeat_dictionary: { enabled: boolean; maximum: number };
  repeat_exercise: { enabled: boolean; maximum: number };
  add_dictionary: { enabled: boolean; maximum: number };
  add_exercise: { enabled: boolean; maximum: number };
}

export interface TaskSchedule {
  hour: number;
  minute: number;
  frequency: 'daily' | 'every_n_days' | 'weekly' | 'monthly';
  frequencyValue?: number; // for every_n_days, day of week (0-6), or day of month (1-31)
}


export interface UserData {
  stars: number;
  lastTaskReload: number;
}
