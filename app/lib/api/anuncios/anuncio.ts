import type { Page } from "../utils/paginated";

export type UUID = string;

export enum AddType {
  TEXT_BANNER = "TEXT_BANNER",
  MEDIA_VERTICAL = "MEDIA_VERTICAL",
  MEDIA_HORIZONTAL = "MEDIA_HORIZONTAL",
}

export enum PaymentState {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface AnuncioViewResponseDTO {
  id: UUID;
  content: string;
  type: AddType;
  contentType: string; // e.g., 'youtube', 'image', etc.
  externalMedia: boolean;
  urlContent: string;
  active: boolean;
  description: string;
  cinemaId: UUID;
  userId: UUID;
  paymentState: PaymentState;
  paidAt: string | null;
  price: number;
  addExpiration: string;
  createdAt: string;
  updatedAt: string;
}

// Conveniencia: tipo de página de anuncios
export type AnuncioPage = Page<AnuncioViewResponseDTO>;

export interface FilterAnuncios {
  type?: AddType | null;
  paymentState?: PaymentState | null;
  active?: boolean | null;
  cinemaId?: UUID | null;
  userId?: UUID | null;
}

const API_BASE = "/v1/adds";

export const searchAnuncios = async (
  filter: FilterAnuncios,
  page: number = 0
): Promise<AnuncioPage> => {
  return await $api<AnuncioPage>(`${API_BASE}/search`, {
    method: "GET",
    params: { ...filter, page },
  });
};

export const getAnuncioAleatorioByCinemaAndType = async (
  cinemaId: UUID,
  type: AddType
): Promise<AnuncioViewResponseDTO | null> => {
  return await $api<AnuncioViewResponseDTO | null>(
    `${API_BASE}/public/cinema/${cinemaId}/type/${type}/random`,
    {
      method: "GET",
      params: { cinemaId, type },
    }
  ).catch(() => null);
};

export const getById = async (id: UUID): Promise<AnuncioViewResponseDTO> => {
  return await $api<AnuncioViewResponseDTO>(`${API_BASE}/${id}`, {
    method: "GET",
  });
};

export const getByCinemaId = async (
  cinemaId: UUID
): Promise<AnuncioViewResponseDTO[]> => {
  return await $api<AnuncioViewResponseDTO[]>(
    `${API_BASE}/cinema/${cinemaId}`,
    {
      method: "GET",
    }
  );
};

export const getByUserId = async (
  userId: UUID
): Promise<AnuncioViewResponseDTO[]> => {
  return await $api<AnuncioViewResponseDTO[]>(`${API_BASE}/user/${userId}`, {
    method: "GET",
  });
};

export const deleteAnuncioById = async (id: UUID): Promise<void> => {
  return await $api<void>(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
};

export const toggleAnuncioActive = async (id: UUID): Promise<void> => {
  return await $api<void>(`${API_BASE}/state/${id}`, {
    method: "PATCH",
  });
};

export const retryPaymentAnuncio = async (id: UUID): Promise<void> => {
  return await $api<void>(`${API_BASE}/retry-paid/${id}`, {
    method: "POST",
  });
}

export type CreateAnuncioMultipart = {
  content: string;
  type: AddType;
  description: string;
  cinemaId: UUID;
  urlContent: string;
  userId: UUID;
  durationDaysId: UUID;
  file: File;
};

export const toAnuncioFormData = (a: CreateAnuncioMultipart): FormData => {
  const fd = new FormData();
  fd.append("content", a.content);
  fd.append("type", a.type);
  fd.append("description", a.description);
  fd.append("cinemaId", a.cinemaId);
  fd.append("urlContent", a.urlContent);
  fd.append("userId", a.userId);
  fd.append("durationDaysId", a.durationDaysId);
  fd.append("file", a.file);
  return fd;
};

export const createAnuncio = async (
  payload: CreateAnuncioMultipart
): Promise<AnuncioViewResponseDTO> => {
  const formData = toAnuncioFormData(payload);
  return await $apiMultipart<AnuncioViewResponseDTO>(`${API_BASE}`, {
    method: "POST",
    body: formData,
  });
};

export type UpdateAnuncioMultipart = {
  content: string;
  description: string;
  urlContent: string;
  file: File;
};

export const toUpdateAnuncioFormData = (
  a: UpdateAnuncioMultipart
): FormData => {
  const fd = new FormData();
  fd.append("content", a.content);
  fd.append("description", a.description);
  fd.append("urlContent", a.urlContent);
  if (a.file) fd.append("file", a.file);
  return fd;
};

export const updateAnuncio = async (
  id: UUID,
  payload: UpdateAnuncioMultipart
): Promise<AnuncioViewResponseDTO> => {
  const formData = toUpdateAnuncioFormData(payload);
  return await $apiMultipart<AnuncioViewResponseDTO>(`${API_BASE}/${id}`, {
    method: "PATCH",
    body: formData,
  });
};
