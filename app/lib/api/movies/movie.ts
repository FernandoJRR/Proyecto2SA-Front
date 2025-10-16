import type { Page } from "../utils/paginated";

export type UUID = string;

export interface ClassificationViewResponseDTO {
  id: UUID;
  name: string;
  description: string;
}

export interface CategoryViewResponseDTO {
  id: UUID;
  name: string;
}

export interface MovieResponseDTO {
  id: UUID;
  title: string;
  duration: number;
  sinopsis: string;
  classificationId: UUID;
  director: string;
  casting: string;
  urlImage: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  classification?: ClassificationViewResponseDTO | null;
  categories: CategoryViewResponseDTO[];
}

export interface SearchQueryMovie {
  title?: string | null;
  active?: boolean | null;
  classificationId?: UUID | null;
  categoryIds?: UUID[] | null;
}

// Conveniencia: tipo de página de películas
export type MoviePage = Page<MovieResponseDTO>;

// API methods

const CURRENT_MOVIE_URI = "/v1/movies";

export const getAllPaginated = async (page: number = 0): Promise<MoviePage> => {
  const response = await $api<MoviePage>(`${CURRENT_MOVIE_URI}/public/all`, {
    method: "GET",
    params: { page },
  });
  return response;
};

export const getMovieById = async (id: string): Promise<MovieResponseDTO> => {
  const response = await $api<MovieResponseDTO>(
    `${CURRENT_MOVIE_URI}/public/${id}`,
    {
      method: "GET",
    }
  );
  return response;
};

export const deleteMovieById = async (id: string): Promise<void> => {
  await $api<void>(`${CURRENT_MOVIE_URI}/${id}`, {
    method: "DELETE",
  });
};

export const searchMovies = async (
  query: SearchQueryMovie,
  page: number = 0
): Promise<MoviePage> => {
  const response = await $api<MoviePage>(`${CURRENT_MOVIE_URI}/public/search`, {
    method: "GET",
    params: { page, ...query },
  });
  return response;
};

export const tooggleMovieActive = async (id: string): Promise<void> => {
  await $api<void>(`${CURRENT_MOVIE_URI}/state/${id}`, {
    method: "PATCH",
  });
};

/**
 * Helper específico para películas (según tu Postman).
 * categoriesId puede repetirse varias veces y image es un File.
 */
export type CreateUpdateMovieMultipart = {
  title: string;
  classificationId: string;
  categoriesId: string[]; // puedes enviar varias llaves con el mismo nombre
  duration: number | string;
  sinopsis: string;
  director: string;
  casting: string;
  image: File; // opcional
};

export const toMovieFormData = (m: CreateUpdateMovieMultipart): FormData => {
  const fd = new FormData();
  fd.append("title", m.title);
  fd.append("classificationId", m.classificationId);
  m.categoriesId?.forEach((id) => fd.append("categoriesId", id));
  fd.append("duration", String(m.duration));
  fd.append("sinopsis", m.sinopsis);
  fd.append("director", m.director);
  fd.append("casting", m.casting);
  if (m.image) fd.append("image", m.image);
  return fd;
};

export const createMovie = async (
  payload: CreateUpdateMovieMultipart
): Promise<MovieResponseDTO> => {
  const formData = toMovieFormData(payload);
  const response = await $apiMultipart<MovieResponseDTO>(
    `${CURRENT_MOVIE_URI}`,
    {
      method: "POST",
      body: formData,
    }
  );
  return response;
};

export const updateMovie = async (
  id: string,
  payload: CreateUpdateMovieMultipart
): Promise<MovieResponseDTO> => {
  const formData = toMovieFormData(payload);
  const response = await $apiMultipart<MovieResponseDTO>(
    `${CURRENT_MOVIE_URI}/${id}`,
    {
      method: "PATCH",
      body: formData,
    }
  );
  return response;
}
