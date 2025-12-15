// Service for tasks operations

import { HttpMethod, RequestBuilder, RequestService } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

// Frontend representations
export interface Task {
  id: string;
  type: 'repeat_dictionary' | 'repeat_exercise' | 'add_dictionary' | 'add_exercise';
  languageId: string;
  languageName: string;
  current: number;
  maximum: number;
  starsReward: number;
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

// Backend DTOs
interface TaskDto {
  uuid: string;
  type: 'REPEAT_DICTIONARY' | 'REPEAT_EXERCISE' | 'ADD_DICTIONARY' | 'ADD_EXERCISE';
  languageUuid: string;
  languageName: string;
  current: number;
  maximum: number;
  starsReward: number;
}

interface TaskSettingsDto {
  languageUuid: string;
  repeatDictionary: { enabled: boolean; maximum: number };
  repeatExercise: { enabled: boolean; maximum: number };
  addDictionary: { enabled: boolean; maximum: number };
  addExercise: { enabled: boolean; maximum: number };
}

interface TaskScheduleDto {
  hour: number;
  minute: number;
  frequency: 'DAILY' | 'EVERY_N_DAYS' | 'WEEKLY' | 'MONTHLY';
  frequencyValue?: number | null;
  lastRunAt?: string; // ISO 8601 format, read-only
}

interface TaskConfigDto {
  settings: TaskSettingsDto[];
  schedule: TaskScheduleDto;
}

// Payloads for creating/updating
interface TaskSettingsForm {
  languageUuid: string;
  repeatDictionary: { enabled: boolean; maximum: number };
  repeatExercise: { enabled: boolean; maximum: number };
  addDictionary: { enabled: boolean; maximum: number };
  addExercise: { enabled: boolean; maximum: number };
}

interface TaskScheduleForm {
  hour: number;
  minute: number;
  frequency: 'DAILY' | 'EVERY_N_DAYS' | 'WEEKLY' | 'MONTHLY';
  frequencyValue?: number | null;
}

interface TaskConfigForm {
  settings: TaskSettingsForm[];
  schedule: TaskScheduleForm;
}

interface TaskProgressForm {
  current: number;
}

// Helper functions to convert between frontend and backend formats
const taskDtoToTask = (dto: TaskDto): Task => ({
  id: dto.uuid,
  type: dto.type.toLowerCase() as Task['type'],
  languageId: dto.languageUuid,
  languageName: dto.languageName,
  current: dto.current,
  maximum: dto.maximum,
  starsReward: dto.starsReward,
});

const taskSettingsDtoToTaskSettings = (dto: TaskSettingsDto): TaskSettings => ({
  languageId: dto.languageUuid,
  repeat_dictionary: dto.repeatDictionary,
  repeat_exercise: dto.repeatExercise,
  add_dictionary: dto.addDictionary,
  add_exercise: dto.addExercise,
});

const taskSettingsToForm = (settings: TaskSettings): TaskSettingsForm => ({
  languageUuid: settings.languageId,
  repeatDictionary: settings.repeat_dictionary,
  repeatExercise: settings.repeat_exercise,
  addDictionary: settings.add_dictionary,
  addExercise: settings.add_exercise,
});

const taskScheduleDtoToTaskSchedule = (dto: TaskScheduleDto): TaskSchedule => ({
  hour: dto.hour,
  minute: dto.minute,
  frequency: dto.frequency.toLowerCase() as TaskSchedule['frequency'],
  frequencyValue: dto.frequencyValue ?? undefined,
});

const taskScheduleToForm = (schedule: TaskSchedule): TaskScheduleForm => ({
  hour: schedule.hour,
  minute: schedule.minute,
  frequency: schedule.frequency.toUpperCase() as TaskScheduleForm['frequency'],
  frequencyValue: schedule.frequencyValue ?? null,
});

// Cache for tasks to prevent duplicate API calls
let tasksCache: Task[] | null = null;
let tasksCacheTime: number = 0;
let tasksLoadingPromise: Promise<Task[]> | null = null;
const CACHE_DURATION = 5000; // 5 seconds cache

export const tasksService = {
  // Clear the cache (useful after updating tasks or settings)
  clearCache: () => {
    tasksCache = null;
    tasksCacheTime = 0;
    tasksLoadingPromise = null;
  },

  // Get current daily tasks
  getTasks: async (skipCache: boolean = false): Promise<Task[]> => {
    const now = Date.now();
    const canUseCache = !skipCache &&
                        tasksCache !== null &&
                        (now - tasksCacheTime) < CACHE_DURATION;

    if (canUseCache) {
      return tasksCache!;
    }

    // If a request is already in progress, wait for it
    if (!skipCache && tasksLoadingPromise !== null) {
      return tasksLoadingPromise;
    }

    const makeRequest = async (): Promise<Task[]> => {
      const service = new RequestService();
      const builder = new RequestBuilder<void>()
        .url('/tasks')
        .method(HttpMethod.GET);

      const req = builder.build();
      const res = await service.send<void, TaskDto[]>(req);
      throwIfError(res, 'Failed to load tasks');

      const tasks = (res.body as TaskDto[] ?? []).map(taskDtoToTask);

      tasksCache = tasks;
      tasksCacheTime = now;

      return tasks;
    };

    tasksLoadingPromise = makeRequest();
    try {
      return await tasksLoadingPromise;
    } finally {
      tasksLoadingPromise = null;
    }
  },

  // Reload/regenerate tasks (manually trigger task generation)
  reloadTasks: async (): Promise<Task[]> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url('/tasks/reload')
      .method(HttpMethod.POST)
      .build();

    const res = await service.send<void, TaskDto[]>(request);
    throwIfError(res, 'Failed to reload tasks');

    const tasks = (res.body as TaskDto[] ?? []).map(taskDtoToTask);

    // Update cache
    tasksCache = tasks;
    tasksCacheTime = Date.now();

    return tasks;
  },

  // Update task progress
  updateTaskProgress: async (taskId: string, current: number): Promise<void> => {
    const service = new RequestService();
    const form: TaskProgressForm = { current };
    const request = new RequestBuilder<TaskProgressForm>()
      .url(`/tasks/${taskId}/progress`)
      .method(HttpMethod.PUT)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<TaskProgressForm, unknown>(request);
    throwIfError(res, 'Failed to update task progress');
    tasksService.clearCache();
  },

  // Get task configuration (settings + schedule)
  getTaskConfig: async (): Promise<{ settings: TaskSettings[]; schedule: TaskSchedule }> => {
    const service = new RequestService();
    const builder = new RequestBuilder<void>()
      .url('/tasks/config')
      .method(HttpMethod.GET);

    const req = builder.build();
    const res = await service.send<void, TaskConfigDto>(req);
    throwIfError(res, 'Failed to load task configuration');

    const config = res.body as TaskConfigDto;
    return {
      settings: config.settings.map(taskSettingsDtoToTaskSettings),
      schedule: taskScheduleDtoToTaskSchedule(config.schedule),
    };
  },

  // Update task configuration (settings + schedule)
  updateTaskConfig: async (settings: TaskSettings[], schedule: TaskSchedule): Promise<void> => {
    const service = new RequestService();
    const form: TaskConfigForm = {
      settings: settings.map(taskSettingsToForm),
      schedule: taskScheduleToForm(schedule),
    };
    const request = new RequestBuilder<TaskConfigForm>()
      .url('/tasks/config')
      .method(HttpMethod.PUT)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<TaskConfigForm, unknown>(request);
    throwIfError(res, 'Failed to update task configuration');
    tasksService.clearCache();
  },

  // Get task settings for all languages (for backward compatibility)
  getTaskSettings: async (): Promise<TaskSettings[]> => {
    const config = await tasksService.getTaskConfig();
    return config.settings;
  },

  // Update task settings (for backward compatibility)
  updateTaskSettings: async (settings: TaskSettings[]): Promise<void> => {
    const config = await tasksService.getTaskConfig();
    await tasksService.updateTaskConfig(settings, config.schedule);
  },

  // Get task schedule (for backward compatibility)
  getTaskSchedule: async (): Promise<TaskSchedule> => {
    const config = await tasksService.getTaskConfig();
    return config.schedule;
  },

  // Update task schedule (for backward compatibility)
  updateTaskSchedule: async (schedule: TaskSchedule): Promise<void> => {
    const config = await tasksService.getTaskConfig();
    await tasksService.updateTaskConfig(config.settings, schedule);
  },
};

