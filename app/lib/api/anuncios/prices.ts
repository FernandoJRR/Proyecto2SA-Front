import type { Page } from "../utils/paginated";

export type UUID = string;

export interface Prices {
  id: UUID;
  cinemaId: UUID;
  amountTextBanner: number;
  amountMediaVertical: number;
  amountMediaHorizontal: number;
  createdAt: string;
  updatedAt: string;
}

export type PricesPage = Page<Prices>;

const API_BASE = "/v1/prices";

export const createByCinemaId = async (cinemaId: UUID): Promise<Prices> => {
  return await $api<Prices>(`${API_BASE}/cinema/${cinemaId}`, {
    method: "POST",
    body: { cinemaId },
  });
};

export const deleteById = async (id: UUID): Promise<void> => {
  return await $api<void>(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
};

export const deleteByCinemaId = async (cinemaId: UUID): Promise<void> => {
  return await $api<void>(`${API_BASE}/cinema/${cinemaId}`, {
    method: "DELETE",
  });
};

export const getByCinemaId = async (cinemaId: UUID): Promise<Prices> => {
  return await $api<Prices>(`${API_BASE}/cinema/${cinemaId}`, {
    method: "GET",
  });
};

export const getAll = async (): Promise<PricesPage> => {
  return await $api<PricesPage>(`${API_BASE}/all`, {
    method: "GET",
  });
};

export const getById = async (id: UUID): Promise<Prices> => {
  return await $api<Prices>(`${API_BASE}/${id}`, {
    method: "GET",
  });
};

export interface UpdatePrices {
  amountTextBanner?: number | null;
  amountMediaVertical?: number | null;
  amountMediaHorizontal?: number | null;
}

export const updateById = async (
  id: UUID,
  data: UpdatePrices
): Promise<Prices> => {
  return await $api<Prices>(`${API_BASE}/${id}`, {
    method: "PATCH",
    body: data,
  });
};
