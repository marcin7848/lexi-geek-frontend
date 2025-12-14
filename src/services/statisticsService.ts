// Service for user statistics operations
// Updated to match API documentation structure

import { HttpMethod, RequestBuilder, RequestService } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

// Backend DTOs - matching the API documentation
interface LanguageStatsDto {
  repeat: number;
  add: number;
}

interface UserStatDto {
  date: string; // ISO date string (YYYY-MM-DD)
  repeat: number;
  add: number;
  stars: number;
  languageStats: Record<string, LanguageStatsDto>;
}

// Frontend types
export interface LanguageStats {
  repeat: number;
  add: number;
}

export interface UserStat {
  date: string;
  repeat: number;
  add: number;
  stars: number;
  languageStats: Record<string, LanguageStats>;
}

// Query parameters for filtering statistics
export interface StatisticsQueryParams {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  languageUuids?: string[]; // Filter by specific languages
  showTotal?: boolean; // Include total statistics in response
  showStars?: boolean; // Include stars data in response
}

// Helper to convert UserStatDto to UserStat
const mapUserStatDtoToUserStat = (dto: UserStatDto): UserStat => {
  return {
    date: dto.date,
    repeat: dto.repeat,
    add: dto.add,
    stars: dto.stars,
    languageStats: dto.languageStats,
  };
};

// Helper to build query string from params
const buildQueryString = (params: StatisticsQueryParams): string => {
  const queryParts: string[] = [];
  
  if (params.startDate) {
    queryParts.push(`startDate=${encodeURIComponent(params.startDate)}`);
  }
  
  if (params.endDate) {
    queryParts.push(`endDate=${encodeURIComponent(params.endDate)}`);
  }
  
  if (params.languageUuids && params.languageUuids.length > 0) {
    params.languageUuids.forEach(uuid => {
      queryParts.push(`languageUuids=${encodeURIComponent(uuid)}`);
    });
  }
  
  if (params.showTotal !== undefined) {
    queryParts.push(`showTotal=${params.showTotal}`);
  }

  if (params.showStars !== undefined) {
    queryParts.push(`showStars=${params.showStars}`);
  }

  return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
};

export const statisticsService = {
  // Get user statistics with optional filters
  getUserStatistics: async (params: StatisticsQueryParams = {}): Promise<UserStat[]> => {
    const service = new RequestService();
    const queryString = buildQueryString(params);
    
    const request = new RequestBuilder<void>()
      .url(`/statistics${queryString}`)
      .method(HttpMethod.GET)
      .build();

    const res = await service.send<void, UserStatDto[]>(request);
    throwIfError(res, 'Failed to load user statistics');

    if (!res.body) {
      return [];
    }

    return res.body.map(mapUserStatDtoToUserStat);
  },

  // Get statistics for a specific language
  getLanguageStatistics: async (
    languageUuid: string,
    params: Omit<StatisticsQueryParams, 'languageUuids'> = {}
  ): Promise<UserStat[]> => {
    const service = new RequestService();
    const queryString = buildQueryString(params);
    
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/statistics${queryString}`)
      .method(HttpMethod.GET)
      .build();

    const res = await service.send<void, UserStatDto[]>(request);
    throwIfError(res, 'Failed to load language statistics');

    if (!res.body) {
      return [];
    }

    return res.body.map(mapUserStatDtoToUserStat);
  },

  // Get statistics summary for a date range
  getStatisticsSummary: async (
    params: StatisticsQueryParams = {}
  ): Promise<{
    totalRepeatedWords: number;
    totalAddedWords: number;
    totalStars: number;
    averagePerDay: {
      repeated: number;
      added: number;
      stars: number;
    };
  }> => {
    const service = new RequestService();
    const queryString = buildQueryString(params);
    
    const request = new RequestBuilder<void>()
      .url(`/statistics/summary${queryString}`)
      .method(HttpMethod.GET)
      .build();

    interface SummaryDto {
      totalRepeatedWords: number;
      totalAddedWords: number;
      totalStars: number;
      averagePerDay: {
        repeated: number;
        added: number;
        stars: number;
      };
    }

    const res = await service.send<void, SummaryDto>(request);
    throwIfError(res, 'Failed to load statistics summary');

    if (!res.body) {
      throw new Error('No response body received');
    }

    return res.body;
  },
};

