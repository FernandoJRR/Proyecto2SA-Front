import type { CinemaResponseDTO } from "./cinema";

export const CURRENT_CINEMA_MOVIE_URL = "/v1/cinema-movies";

export interface CinemaMovieResponseDTO {
  id: string;
  cinema: CinemaResponseDTO;
  movieId: string;
  active: boolean;
}

export interface CreateCinemaMovieRequest{
  cinemaId: string;
  movieId: string;
}

export const getCarteleraActivaCine = async (
  cinemaId: string
): Promise<CinemaMovieResponseDTO[]> => {
  return $api<CinemaMovieResponseDTO[]>(
    `${CURRENT_CINEMA_MOVIE_URL}/public/${cinemaId}/active`,
    {
      method: "GET",
    }
  );
};

export const getTodasCartelerasCine = async (
  cinemaId: string
): Promise<CinemaMovieResponseDTO[]> => {
  return $api<CinemaMovieResponseDTO[]>(
    `${CURRENT_CINEMA_MOVIE_URL}/public/${cinemaId}`,
    {
      method: "GET",
    }
  );
}

export const createCinemaMovie = async (
  data: CreateCinemaMovieRequest
): Promise<CinemaMovieResponseDTO> => {
  return $api<CinemaMovieResponseDTO>(`${CURRENT_CINEMA_MOVIE_URL}`, {
    method: "POST",
    body: data,
  });
}

export const toogleCinemaMovieStatus = async (
  cinemaMovieId: string
): Promise<CinemaMovieResponseDTO> => {
  return $api<CinemaMovieResponseDTO>(
    `${CURRENT_CINEMA_MOVIE_URL}/${cinemaMovieId}/toggle`,
    {
      method: "PATCH",
    }
  );
}
