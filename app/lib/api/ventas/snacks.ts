import type { Page } from "../utils/paginated";

export const CURRENT_SNACKS_URI = "/v1/snacks";
export interface SnackView {
  id: string;
  cinemaId: string;
  name: string;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface SnackResponseDTO {
  id: string;
  cinemaId: string;
  name: string;
  price: number;
  imageUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getSnackById = async (id: string): Promise<SnackResponseDTO> => {
  const response = await $api<SnackResponseDTO>(
    `${CURRENT_SNACKS_URI}/public/${id}`,
    {
      method: "GET",
    }
  );
  return response;
};

export interface CreateSnackMultipart {
  name: string;
  price: number;
  cinemaId: string;
  urlImage?: string;
  imageFile?: File | null;
}

export const toSnackFormData = (snack: CreateSnackMultipart): FormData => {
  const formData = new FormData();
  formData.append("name", snack.name);
  formData.append("price", snack.price.toString());
  formData.append("cinemaId", snack.cinemaId);
  if (snack.urlImage) {
    formData.append("urlImage", snack.urlImage);
  }
  if (snack.imageFile) {
    formData.append("imageFile", snack.imageFile);
  }
  return formData;
};

export const createSnack = async (
  body: CreateSnackMultipart
): Promise<SnackResponseDTO> => {
  const formData = toSnackFormData(body);
  const response = await $apiMultipart<SnackResponseDTO>(
    `${CURRENT_SNACKS_URI}`,
    {
      method: "POST",
      body: formData,
    }
  );
  return response;
};

export interface UpdateSnackMultipart {
  name: string;
  price: number;
  urlImage?: string;
  imageFile?: File | null;
}

export const toUpdateSnackFormData = (
  snack: UpdateSnackMultipart
): FormData => {
  const formData = new FormData();
  formData.append("name", snack.name);
  formData.append("price", snack.price.toString());
  if (snack.urlImage) {
    formData.append("urlImage", snack.urlImage);
  }
  if (snack.imageFile) {
    formData.append("imageFile", snack.imageFile);
  }
  return formData;
};

export const updateSnack = async (
  id: string,
  body: UpdateSnackMultipart
): Promise<SnackResponseDTO> => {
  const formData = toUpdateSnackFormData(body);
  const response = await $apiMultipart<SnackResponseDTO>(
    `${CURRENT_SNACKS_URI}/${id}`,
    {
      method: "PATCH",
      body: formData,
    }
  );
  return response;
};

export interface SearchSnacksParams {
  name?: string | null;
  active?: boolean | null;
  cinemaId?: string | null;
}

export type SnackPage = Page<SnackView>;

export const searchSnacks = async (
  page: number = 0,
  params?: SearchSnacksParams
): Promise<SnackPage> => {
  const response = await $api<SnackPage>(
    `${CURRENT_SNACKS_URI}/public/search`,
    {
      method: "GET",
      params: { page, ...params },
    }
  );
  return response;
};

export interface SearchSnacksByCinemaParams {
  name?: string | null;
  active?: boolean | null;
}

export const searchSnacksByCinema = async (
  cinemaId: string,
  page: number = 0,
  params?: SearchSnacksByCinemaParams
): Promise<SnackPage> => {
  const response = await $api<SnackPage>(
    `${CURRENT_SNACKS_URI}/public/cinema/${cinemaId}`,
    {
      method: "GET",
      params: { page, ...params },
    }
  );
  return response;
};
