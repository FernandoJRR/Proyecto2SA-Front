// Interfaces for User API requests and DTOs
export interface CreateProfileDTO {
  firstName: string; //min 2, max 50
  lastName: string; //min 2, max 50
}

export interface CreateUserRequest {
  email: string; //min 5, max 100
  password: string; //min 8, max 100
  profile: CreateProfileDTO;
}

export interface CreateAdministrativeUserRequest extends CreateUserRequest {
  role: "ADMIN" | "CINEMA_ADMIN";
}

export interface CreateNoAdministrativeUserRequest extends CreateUserRequest {
  sponsor: boolean;
}

export interface ProfileResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  role: string;
  profile: ProfileResponseDTO;
}

// API Segments
export const CURRENT_USER_URI = "/v1/users";

// API methods

export const createAdministrativeUser = async (
  request: CreateAdministrativeUserRequest
): Promise<UserResponseDTO> => {
  const response = await $api<UserResponseDTO>(`${CURRENT_USER_URI}/admin`, {
    method: "POST",
    body: request,
  });
  return response;
};

export const createNoAdministrativeUser = async (
  request: CreateNoAdministrativeUserRequest
): Promise<UserResponseDTO> => {
  const response = await $api<UserResponseDTO>(`${CURRENT_USER_URI}/public/register`, {
    method: "POST",
    body: request,
  });
  return response;
};

export const getSponsoredUsers = async (): Promise<UserResponseDTO[]> => {
  const response = await $api<UserResponseDTO[]>(`${CURRENT_USER_URI}/sponsors`, {
    method: "GET",
  });
  return response;
}
