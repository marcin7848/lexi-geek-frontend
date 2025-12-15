// Service for recent activity operations

import { HttpMethod, RequestBuilder, RequestService, type PageDto, type PageableRequest } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

// Frontend representation
export interface Activity {
  id: string;
  languageId: string;
  languageName: string;
  categoryId: string;
  categoryName: string;
  timestamp: number;
  type: 'repeat' | 'add';
}

// Backend DTO
interface ActivityDto {
  uuid: string;
  languageUuid: string;
  languageName: string;
  categoryUuid: string;
  categoryName: string;
  timestamp: string; // ISO 8601 format
  type: 'REPEAT' | 'ADD';
}

// Filter form for querying activities
export interface ActivityFilterForm {
  languageUuid?: string;
  categoryUuid?: string;
  type?: 'REPEAT' | 'ADD';
  fromTimestamp?: string; // ISO 8601 format
  toTimestamp?: string; // ISO 8601 format
}

// Helper function to convert DTO to frontend format
const activityDtoToActivity = (dto: ActivityDto): Activity => ({
  id: dto.uuid,
  languageId: dto.languageUuid,
  languageName: dto.languageName,
  categoryId: dto.categoryUuid,
  categoryName: dto.categoryName,
  timestamp: new Date(dto.timestamp).getTime(),
  type: dto.type.toLowerCase() as Activity['type'],
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
        if (filter.categoryUuid) builder.param('categoryUuid', filter.categoryUuid);
        if (filter.type) builder.param('type', filter.type);
        if (filter.fromTimestamp) builder.param('fromTimestamp', filter.fromTimestamp);
        if (filter.toTimestamp) builder.param('toTimestamp', filter.toTimestamp);
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

  // Fetch recent activities (last 50 by default, sorted by timestamp descending)
  getRecentActivities: async (limit: number = 50): Promise<Activity[]> => {
    return await activityService.getActivities(
      null,
      {
        singlePage: false,
        page: 0,
        pageSize: limit,
        sort: 'timestamp,desc'
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

  // Fetch activities for a specific category
  getActivitiesByCategory: async (categoryId: string, pageable?: PageableRequest): Promise<Activity[]> => {
    return await activityService.getActivities(
      { categoryUuid: categoryId },
      pageable ?? { singlePage: true }
    );
  },

  // Fetch activities by type (repeat or add)
  getActivitiesByType: async (type: 'repeat' | 'add', pageable?: PageableRequest): Promise<Activity[]> => {
    return await activityService.getActivities(
      { type: type.toUpperCase() as 'REPEAT' | 'ADD' },
      pageable ?? { singlePage: true }
    );
  },

  // Fetch activities within a date range
  getActivitiesInRange: async (fromDate: Date, toDate: Date, pageable?: PageableRequest): Promise<Activity[]> => {
    return await activityService.getActivities(
      {
        fromTimestamp: fromDate.toISOString(),
        toTimestamp: toDate.toISOString()
      },
      pageable ?? { singlePage: true }
    );
  },
};

