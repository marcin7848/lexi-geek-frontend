// Service for recent activity operations

import { HttpMethod, RequestBuilder, RequestService, type PageDto, type PageableRequest } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

// Frontend representation
export interface Activity {
  id: string;
  languageId: string;
  languageName: string;
  categoryId: string | null;
  title: string | null; // Changed from categoryName - for STARS_ADDED this will be the task type (e.g., 'REPEAT_DICTIONARY')
  created: number;
  type: 'REPEATING_FINISHED' | 'STARS_ADDED';
  param: string;
}

// Backend DTO
interface ActivityDto {
  uuid: string;
  languageName: string;
  title: string | null; // Changed from categoryName
  created: string; // format: yyyy-MM-dd HH:mm:ss
  type: 'REPEATING_FINISHED' | 'STARS_ADDED';
  param: string;
}

// Filter form for querying activities
export interface ActivityFilterForm {
  languageUuid?: string;
  // categoryUuid removed - no longer supported by backend
  type?: 'REPEATING_FINISHED' | 'STARS_ADDED';
  rangeMin?: string; // format: yyyy-MM-dd HH:mm:ss
  rangeMax?: string; // format: yyyy-MM-dd HH:mm:ss
}

// Helper function to convert DTO to frontend format
const activityDtoToActivity = (dto: ActivityDto): Activity => ({
  id: dto.uuid,
  languageId: '', // Not provided in API response anymore
  languageName: dto.languageName,
  categoryId: null, // Not provided in API response anymore
  title: dto.title, // Changed from categoryName
  created: new Date(dto.created).getTime(),
  type: dto.type,
  param: dto.param,
});

// Cache for activities to prevent duplicate API calls
let activitiesCache: Activity[] | null = null;
let activitiesCacheTime: number = 0;
let activitiesLoadingPromise: Promise<Activity[]> | null = null;
const CACHE_DURATION = 5000; // 5 seconds cache

export const activityService = {
  // Clear the cache (useful after adding new activities)
  clearCache: () => {
    activitiesCache = null;
    activitiesCacheTime = 0;
    activitiesLoadingPromise = null;
  },

  // Fetch activities from backend with optional filter and pagination
  getActivities: async (
    filter?: ActivityFilterForm | null,
    pageable?: PageableRequest | null,
    skipCache: boolean = false
  ): Promise<Activity[]> => {
    // Check if we can use cached data (only for full list without filters)
    const now = Date.now();
    const isCacheable = !skipCache &&
                        !filter &&
                        pageable?.singlePage === true &&
                        !pageable?.sort;

    const canUseCache = isCacheable &&
                        activitiesCache !== null &&
                        (now - activitiesCacheTime) < CACHE_DURATION;

    if (canUseCache) {
      return activitiesCache!;
    }

    // If a request is already in progress for cacheable data, wait for it
    if (isCacheable && activitiesLoadingPromise !== null) {
      return activitiesLoadingPromise;
    }

    const makeRequest = async (): Promise<Activity[]> => {
      const service = new RequestService();
      const builder = new RequestBuilder<void>()
        .url('/activities')
        .method(HttpMethod.GET)
        .pageable(pageable ?? undefined);

      // Append filter params if provided
      if (filter) {
        if (filter.languageUuid) builder.param('languageUuid', filter.languageUuid);
        // categoryUuid removed - no longer supported
        if (filter.type) builder.param('type', filter.type);
        if (filter.rangeMin) builder.param('range.min', filter.rangeMin);
        if (filter.rangeMax) builder.param('range.max', filter.rangeMax);
      }

      const req = builder.build();
      const res = await service.send<void, PageDto<ActivityDto>>(req);
      throwIfError(res, 'Failed to load activities');

      const page = res.body as PageDto<ActivityDto> | null;
      const items = page?.items ?? [];
      const activities = items.map(activityDtoToActivity);

      // Cache the result if it's a full list without filters
      if (isCacheable) {
        activitiesCache = activities;
        activitiesCacheTime = now;
      }

      return activities;
    };

    // Store the promise for cacheable requests to prevent concurrent calls
    if (isCacheable) {
      activitiesLoadingPromise = makeRequest();
      try {
        return await activitiesLoadingPromise;
      } finally {
        activitiesLoadingPromise = null;
      }
    } else {
      return makeRequest();
    }
  },

  // Fetch recent activities (last 50 by default, sorted by created descending)
  getRecentActivities: async (limit: number = 50): Promise<Activity[]> => {
    return await activityService.getActivities(
      null,
      {
        singlePage: false,
        page: 1,
        pageSize: limit,
        sort: 'created',
        order: 'desc'
      }
    );
  },

  // Fetch activities for a specific language
  getActivitiesByLanguage: async (languageId: string, pageable?: PageableRequest): Promise<Activity[]> => {
    return await activityService.getActivities(
      { languageUuid: languageId },
      pageable ?? { singlePage: true }
    );
  },

  // Fetch activities by type (REPEATING_FINISHED or STARS_ADDED)
  getActivitiesByType: async (type: 'REPEATING_FINISHED' | 'STARS_ADDED', pageable?: PageableRequest): Promise<Activity[]> => {
    return await activityService.getActivities(
      { type: type },
      pageable ?? { singlePage: true }
    );
  },

  // Fetch activities within a date range
  getActivitiesInRange: async (fromDate: Date, toDate: Date, pageable?: PageableRequest): Promise<Activity[]> => {
    const formatDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    return await activityService.getActivities(
      {
        rangeMin: formatDateTime(fromDate),
        rangeMax: formatDateTime(toDate)
      },
      pageable ?? { singlePage: true }
    );
  },
};

