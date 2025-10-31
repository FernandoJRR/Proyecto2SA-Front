import type { CinemaMovieResponseDTO } from "./cinema-movie";
import type { CinemaHallResponseDTO } from "./hall";

export const CURRENT_CINEMA_SHOWTIME_URL = "/v1/showtimes";

export interface ShowtimeResponseDTO {
  id: string;
  cinemaMovie: CinemaMovieResponseDTO;
  hall: CinemaHallResponseDTO;
  startTime: string;
  endTime: string;
  ticketsAvailable: number;
}

export interface CreateShowtimeRequest {
  cinemaMovieId: string; // UUID
  hallId: string; // UUID
  // Use ISO 8601 date-time strings, e.g. "2025-10-30T14:00:00"
  startTime: string;
  endTime: string;
}

export const getAllShowtimes = async (): Promise<ShowtimeResponseDTO[]> => {
  return $api<ShowtimeResponseDTO[]>(`${CURRENT_CINEMA_SHOWTIME_URL}`, {
    method: "GET",
  });
};

export const getShowtimesByCinema = async (
  cinemaId: string
): Promise<ShowtimeResponseDTO[]> => {
  return $api<ShowtimeResponseDTO[]>(
    `${CURRENT_CINEMA_SHOWTIME_URL}/public/cinema/${cinemaId}`,
    {
      method: "GET",
    }
  );
};

export const getShowtimesById = async (
  showtimeId: string
): Promise<ShowtimeResponseDTO> => {
  return $api<ShowtimeResponseDTO>(
    `${CURRENT_CINEMA_SHOWTIME_URL}/public/${showtimeId}`,
    {
      method: "GET",
    }
  );
};

export const createShowtime = async (
  data: CreateShowtimeRequest
): Promise<ShowtimeResponseDTO> => {
  return $api<ShowtimeResponseDTO>(`${CURRENT_CINEMA_SHOWTIME_URL}`, {
    method: "POST",
    body: data,
  });
};

export interface UpdateShowtimeRequest {
  // Use ISO 8601 date-time strings, e.g. "2025-10-30T14:00:00"
  startTime: string;
  endTime: string;
}

// Update showtime by id (PATCH). Backend expected: { startTime, endTime }
export const updateShowtime = async (
  showtimeId: string,
  data: UpdateShowtimeRequest
): Promise<ShowtimeResponseDTO> => {
  return $api<ShowtimeResponseDTO>(
    `${CURRENT_CINEMA_SHOWTIME_URL}/${showtimeId}`,
    {
      method: "PATCH",
      body: data,
    }
  );
};
