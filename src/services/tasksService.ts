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
  type: 'repeat_dictionary' | 'repeat_exercise' | 'add_dictionary' | 'add_exercise';
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
  frequency: 'daily' | 'every_n_days' | 'weekly' | 'monthly';
  frequencyValue?: number;
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
  frequency: 'daily' | 'every_n_days' | 'weekly' | 'monthly';
  frequencyValue?: number;
}

interface TaskProgressForm {
  current: number;
}

// Helper functions to convert between frontend and backend formats
const taskDtoToTask = (dto: TaskDto): Task => ({
  id: dto.uuid,
  type: dto.type,
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
  frequency: dto.frequency,
  frequencyValue: dto.frequencyValue,
});

const taskScheduleToForm = (schedule: TaskSchedule): TaskScheduleForm => ({
  hour: schedule.hour,
  minute: schedule.minute,
  frequency: schedule.frequency,
  frequencyValue: schedule.frequencyValue,
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

  // Get task settings for all languages
  getTaskSettings: async (): Promise<TaskSettings[]> => {
    const service = new RequestService();
    const builder = new RequestBuilder<void>()
      .url('/tasks/settings')
      .method(HttpMethod.GET);

    const req = builder.build();
    const res = await service.send<void, TaskSettingsDto[]>(req);
    throwIfError(res, 'Failed to load task settings');

    return (res.body as TaskSettingsDto[] ?? []).map(taskSettingsDtoToTaskSettings);
  },

  // Update task settings (expects array of settings for all languages)
  updateTaskSettings: async (settings: TaskSettings[]): Promise<void> => {
    const service = new RequestService();
    const forms = settings.map(taskSettingsToForm);
    const request = new RequestBuilder<TaskSettingsForm[]>()
      .url('/tasks/settings')
      .method(HttpMethod.PUT)
      .contentTypeHeader('application/json')
      .body(forms)
      .build();

    const res = await service.send<TaskSettingsForm[], unknown>(request);
    throwIfError(res, 'Failed to update task settings');
    tasksService.clearCache();
  },

  // Get task schedule
  getTaskSchedule: async (): Promise<TaskSchedule> => {
    const service = new RequestService();
    const builder = new RequestBuilder<void>()
      .url('/tasks/schedule')
      .method(HttpMethod.GET);

    const req = builder.build();
    const res = await service.send<void, TaskScheduleDto>(req);
    throwIfError(res, 'Failed to load task schedule');

    return taskScheduleDtoToTaskSchedule(res.body as TaskScheduleDto);
  },

  // Update task schedule
  updateTaskSchedule: async (schedule: TaskSchedule): Promise<void> => {
    const service = new RequestService();
    const form = taskScheduleToForm(schedule);
    const request = new RequestBuilder<TaskScheduleForm>()
      .url('/tasks/schedule')
      .method(HttpMethod.PUT)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<TaskScheduleForm, unknown>(request);
    throwIfError(res, 'Failed to update task schedule');
    tasksService.clearCache();
  },
};

