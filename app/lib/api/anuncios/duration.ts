export type UUID = string;

export interface DurationDays {
  id: UUID;
  days: number;
  createdAt: string;
}

const API_BASE = "/v1/durations";

export const getById = async (id: UUID): Promise<DurationDays> => {
  return await $api<DurationDays>(`${API_BASE}/${id}`, {
    method: "GET",
  });
}

export const deleteById = async (id: UUID): Promise<void> => {
  return await $api<void>(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
}

export const getAll = async (): Promise<DurationDays[]> => {
  return await $api<DurationDays[]>(`${API_BASE}`, {
    method: "GET",
  });
}

export const create = async (days: number): Promise<DurationDays> => {
  return await $api<DurationDays>(`${API_BASE}`, {
    method: "POST",
    body: { days },
  });
}