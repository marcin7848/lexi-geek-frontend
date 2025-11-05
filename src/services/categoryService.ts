// Service for category operations

import { Category, CategoryMode, CategoryMethod } from "@/types/category";
import { HttpMethod, RequestBuilder, RequestService, type PageDto, type PageableRequest } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

// Backend DTO
interface CategoryDto {
  uuid: string;
  parentUuid: string | null;
  name: string;
  mode: CategoryMode;
  method: CategoryMethod;
  position: number;
}

// Filter form for querying categories
export interface CategoryFilterForm {
  uuid?: string;
  parentUuid?: string;
  name?: string;
  mode?: CategoryMode;
  method?: CategoryMethod;
  position?: number;
}

// Form for creating/updating categories
export interface CategoryForm {
  name: string;
  mode: CategoryMode;
  method: CategoryMethod;
  parentUuid: string | null;
}

export const categoryService = {
  // Get categories with optional filters and pagination
  getCategories: async (
    languageUuid: string,
    filter?: CategoryFilterForm | null,
    pageable?: PageableRequest | null
  ): Promise<Category[]> => {
    const service = new RequestService();
    const builder = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories`)
      .method(HttpMethod.GET)
      .pageable(pageable ?? undefined);

    // Append filter params if provided
    if (filter) {
      if (filter.uuid) builder.param('uuid', filter.uuid);
      if (filter.parentUuid) builder.param('parentUuid', filter.parentUuid);
      if (filter.name) builder.param('name', filter.name);
      if (filter.mode) builder.param('mode', filter.mode);
      if (filter.method) builder.param('method', filter.method);
      if (typeof filter.position === 'number') builder.param('position', String(filter.position));
    }

    const req = builder.build();
    const res = await service.send<void, PageDto<CategoryDto>>(req);
    throwIfError(res, 'Failed to load categories');

    const page = res.body as PageDto<CategoryDto> | null;
    const items = page?.items ?? [];
    return items.map((c) => ({
      uuid: c.uuid,
      parentUuid: c.parentUuid,
      name: c.name,
      mode: c.mode,
      method: c.method,
      position: c.position,
    }));
  },

  // Create a new category
  createCategory: async (languageUuid: string, form: CategoryForm): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<CategoryForm>()
      .url(`/languages/${languageUuid}/categories`)
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<CategoryForm, unknown>(request);
    throwIfError(res, 'Failed to create category');
    return;
  },

  // Update an existing category
  updateCategory: async (languageUuid: string, categoryUuid: string, form: CategoryForm): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<CategoryForm>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}`)
      .method(HttpMethod.PUT)
      .contentTypeHeader('application/json')
      .body(form)
      .build();

    const res = await service.send<CategoryForm, unknown>(request);
    throwIfError(res, 'Failed to update category');
    return;
  },

  // Delete a category
  deleteCategory: async (languageUuid: string, categoryUuid: string): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}`)
      .method(HttpMethod.DELETE)
      .responseAsVoid()
      .build();

    const res = await service.sendVoid(request);
    throwIfError(res, 'Failed to delete category');
    return;
  },

  // Helper to get a single category by UUID
  getById: async (languageUuid: string, categoryUuid: string): Promise<Category | null> => {
    const categories = await categoryService.getCategories(
      languageUuid,
      { uuid: categoryUuid },
      { singlePage: true }
    );
    return categories.find(cat => cat.uuid === categoryUuid) || null;
  },

  // Get all categories for a language (convenience method)
  getAll: async (languageUuid: string): Promise<Category[]> => {
    return await categoryService.getCategories(languageUuid, null, { singlePage: true });
  },

  // Update category position and/or parent (for drag and drop)
  updateCategoryPosition: async (
    languageUuid: string,
    categoryUuid: string,
    data: {
      parentUuid: string | null;
      position: number;
    }
  ): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<typeof data>()
      .url(`/languages/${languageUuid}/categories/${categoryUuid}/position`)
      .method(HttpMethod.PATCH)
      .contentTypeHeader('application/json')
      .body(data)
      .build();

    const res = await service.send<typeof data, unknown>(request);
    throwIfError(res, 'Failed to update category position');
    return;
  },
};
