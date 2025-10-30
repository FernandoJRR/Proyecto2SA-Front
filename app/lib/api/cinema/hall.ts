import type { CinemaResponseDTO } from "./cinema";

export interface CinemaHallResponseDTO {
  id: string;
  cinema: CinemaResponseDTO;
  name: string;
  columns: number;
  rows: number;
  acceptComments: boolean;
  visible: boolean;
}

export const CURRENT_CINEMA_HALL_URI = "/v1/halls";

export interface CreateCinemaHallRequest {
  cinemaId: string;
  name: string; // min 2, max 255
  columns: number; // min 1
  rows: number;
}

export const createCinemaHall = async (
  body: CreateCinemaHallRequest
): Promise<CinemaHallResponseDTO> => {
  const response = await $api<CinemaHallResponseDTO>(
    `${CURRENT_CINEMA_HALL_URI}`,
    {
      method: "POST",
      body,
    }
  );
  return response;
};

export const getCinemaHallById = async (
  id: string
): Promise<CinemaHallResponseDTO> => {
  const response = await $api<CinemaHallResponseDTO>(
    `${CURRENT_CINEMA_HALL_URI}/public/${id}`,
    {
      method: "GET",
    }
  );
  return response;
};

export const getAllCinemaHalls = async (): Promise<CinemaHallResponseDTO[]> => {
  const response = await $api<CinemaHallResponseDTO[]>(
    `${CURRENT_CINEMA_HALL_URI}/all`,
    {
      method: "GET",
    }
  );
  return response;
};

export interface UpdateCinemaHallRequest {
  name: string; // min 2, max 255
  columns: number; // min 1
  rows: number;
}

export const updateCinemaHall = async (
  id: string,
  body: UpdateCinemaHallRequest
): Promise<CinemaHallResponseDTO> => {
  const response = await $api<CinemaHallResponseDTO>(
    `${CURRENT_CINEMA_HALL_URI}/${id}`,
    {
      method: "PATCH",
      body,
    }
  );
  return response;
};

export const toggleComments = async (
  id: string
): Promise<CinemaHallResponseDTO> => {
  const response = await $api<CinemaHallResponseDTO>(
    `${CURRENT_CINEMA_HALL_URI}/${id}/toggle-comments`,
    {
      method: "PATCH",
    }
  );
  return response;
};

export const toggleVisibility = async (
  id: string
): Promise<CinemaHallResponseDTO> => {
  const response = await $api<CinemaHallResponseDTO>(
    `${CURRENT_CINEMA_HALL_URI}/${id}/toggle-visibility`,
    {
      method: "PATCH",
    }
  );
  return response;
};
