import type { UUID } from "./movie";

export interface CategoryResponseDTO {
  id: UUID;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const CURRENT_CATEGORY_URI = "/v1/categories";

export const searchCategoriesByName = async (
  name: string
): Promise<CategoryResponseDTO[]> => {
  const response = await $api<CategoryResponseDTO[]>(
    `${CURRENT_CATEGORY_URI}/public/search`,
    {
      method: "GET",
      params: name ? { query: name } : undefined,
    }
  );
  return response;
};


export const getCategoryById = async (
  id: UUID
): Promise<CategoryResponseDTO> => {
  const response = await $api<CategoryResponseDTO>(
    `${CURRENT_CATEGORY_URI}/public/${id}`,
    {
      method: "GET",
    }
  );
  return response;
}

export interface CreateUpdateCategoryDTO {
  name: string;
}

export const createCategory = async (
  payload: CreateUpdateCategoryDTO
): Promise<CategoryResponseDTO> => {
  const response = await $api<CategoryResponseDTO>(
    `${CURRENT_CATEGORY_URI}`,
    {
      method: "POST",
      body: payload,
    }
  );
  return response;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await $api<void>(`${CURRENT_CATEGORY_URI}/${id}`, {
    method: "DELETE",
  });
};

export const updateCategory = async (
  id: UUID,
  payload: CreateUpdateCategoryDTO
): Promise<CategoryResponseDTO> => {
  const response = await $api<CategoryResponseDTO>(
    `${CURRENT_CATEGORY_URI}/${id}`,
    {
      method: "PATCH",
      body: payload,
    }
  );
  return response;
}