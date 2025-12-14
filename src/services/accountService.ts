// Service for account-related operations

import { HttpMethod, RequestBuilder, RequestService } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

export const accountService = {
  /**
   * Get the current number of stars for the authenticated user's account
   * @returns The number of stars as an integer
   */
  getStars: async (): Promise<number> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url('/account/stars')
      .method(HttpMethod.GET)
      .acceptHeader('application/json')
      .build();

    const res = await service.send<void, number>(request);
    throwIfError(res, 'Failed to fetch stars');

    return res.body ?? 0;
  },
};

