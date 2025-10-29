type UUID = string;

export interface CompanyResponseDTO {
  id: UUID;
  name: string;
  address: string;
  phoneNumber: string;
}

// This interface is used when creating or updating a company
export interface SaveCompanyRequest {
  name: string; //min 2, max 150
  address: string; //min 5, max 255
  phoneNumber: string; // 8 digitos
}

export const CURRENT_COMPANY_URI = "/v1/companies";

export const createCompany = async (
  request: SaveCompanyRequest
): Promise<CompanyResponseDTO> => {
  const response = await $api<CompanyResponseDTO>(`${CURRENT_COMPANY_URI}`, {
    method: "POST",
    body: request,
  });
  return response;
};

export const getCompanyById = async (
  companyId: UUID
): Promise<CompanyResponseDTO> => {
  const response = await $api<CompanyResponseDTO>(
    `${CURRENT_COMPANY_URI}/${companyId}`,
    {
      method: "GET",
    }
  );
  return response;
};

export const getCompanies = async (): Promise<CompanyResponseDTO[]> => {
  const response = await $api<CompanyResponseDTO[]>(`${CURRENT_COMPANY_URI}`, {
    method: "GET",
  });
  return response;
};

export const updateCompany = async (
  companyId: UUID,
  request: SaveCompanyRequest
): Promise<CompanyResponseDTO> => {
  const response = await $api<CompanyResponseDTO>(
    `${CURRENT_COMPANY_URI}/${companyId}`,
    {
      method: "PATCH",
      body: request,
    }
  );
  return response;
};
