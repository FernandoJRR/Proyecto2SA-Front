import type { CompanyResponseDTO } from "../company/company";

// DTO response Cinema

export interface CinemaResponseDTO {
  id: string;
  company: CompanyResponseDTO;
  name: string;
  costPerDay: number;
  createdAt: string;
}

// URL Cinema API
export const CURRENT_CINEMA_URI = "/v1/cinemas";

// HTTP Methods for Cinema API

// Create
export interface CreateCinemaRequest {
  companyId: string;
  name: string; // min 2, max 255
  costPerDay: number; // min 0
  createdAt: string;
}

export const createCinema = async (
  body: CreateCinemaRequest
): Promise<CinemaResponseDTO> => {
  const response = await $api<CinemaResponseDTO>(`${CURRENT_CINEMA_URI}`, {
    method: "POST",
    body,
  });
  return response;
};

export const getCinemaById = async (id: string): Promise<CinemaResponseDTO> => {
  const response = await $api<CinemaResponseDTO>(
    `${CURRENT_CINEMA_URI}/public/${id}`,
    {
      method: "GET",
    }
  );
  return response;
};

export const getAllCinemas = async (): Promise<CinemaResponseDTO[]> => {
  const response = await $api<CinemaResponseDTO[]>(
    `${CURRENT_CINEMA_URI}/public/all`,
    {
      method: "GET",
    }
  );
  return response;
};


export const getCinemasByCompanyId = async (
  companyId: string
): Promise<CinemaResponseDTO[]> => {
  const response = await $api<CinemaResponseDTO[]>(
    `${CURRENT_CINEMA_URI}/public/by-company/${companyId}`,
    {
      method: "GET",
    }
  );
  return response;
}


// update
export interface UpdateCinemaRequest{
  name: string; // min 2, max 255
  costPerDay: number; // min 0
  costChangeDate: string;
}

export const updateCinema = async (
  id: string,
  body: UpdateCinemaRequest
): Promise<CinemaResponseDTO> => {
  const response = await $api<CinemaResponseDTO>(
    `${CURRENT_CINEMA_URI}/${id}`,
    {
      method: "PATCH",
      body,
    }
  );
  return response;
};
