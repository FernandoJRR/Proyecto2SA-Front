import type { UUID } from "./movie";

export interface ClassificationResponseDTO {
  id: UUID;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const CURRENT_CLASSIFICATION_URI = "/v1/classifications";

export const getAllClassifications = async (): Promise<
  ClassificationResponseDTO[]
> => {
  const response = await $api<ClassificationResponseDTO[]>(
    `${CURRENT_CLASSIFICATION_URI}/public/all`,
    {
      method: "GET",
    }
  );
  return response;
};

export const getClassificationById = async (
  id: string
): Promise<ClassificationResponseDTO> => {
  const response = await $api<ClassificationResponseDTO>(
    `${CURRENT_CLASSIFICATION_URI}/public/${id}`,
    {
      method: "GET",
    }
  );
  return response;
};

export interface CreateClassificationDTO {
  name: string;
  description: string;
}

export const createClassification = async (
  payload: CreateClassificationDTO
): Promise<ClassificationResponseDTO> => {
  const response = await $api<ClassificationResponseDTO>(
    `${CURRENT_CLASSIFICATION_URI}`,
    {
      method: "POST",
      body: payload,
    }
  );
  return response;
};

export const deleteClassification = async (id: string): Promise<void> => {
  await $api<void>(`${CURRENT_CLASSIFICATION_URI}/${id}`, {
    method: "DELETE",
  });
};

export const getByIds = async (
  ids: UUID[]
): Promise<ClassificationResponseDTO[]> => {
  const response = await $api<ClassificationResponseDTO[]>(
    `${CURRENT_CLASSIFICATION_URI}/public/ids`,
    {
      method: "POST",
      body: ids,
    }
  );
  return response;
};
