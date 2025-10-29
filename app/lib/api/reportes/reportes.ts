import {
  CURRENT_ANUNCIO_URI,
  type AddType,
  type AnuncioViewResponseDTO,
} from "../anuncios/anuncio";

export interface AnunciosComradosQuery {
  from: string; // ISO date time string e.g. 2025-10-01T00:00:00
  to: string; // ISO date time string e.g. 2025-10-31T23:59:59
  addType?: AddType; // optional
  periodFrom?: string; // ISO date time string - optional 2025-10-01
  periodTo?: string; // ISO date time string - optional 2025-10-31
}

export const anunciosComprados = async (
  query: AnunciosComradosQuery
): Promise<AnuncioViewResponseDTO[]> => {
  const response = await $api<AnuncioViewResponseDTO[]>(
    `${CURRENT_ANUNCIO_URI}/report/bought`,
    {
      method: "POST",
      params: query,
    }
  );
  return response;
};

export const anunciosCompradosPdf = async (
  query: AnunciosComradosQuery
): Promise<Blob> => {
  const response = await postBlobToApi(
    `${CURRENT_ANUNCIO_URI}/report/bought/pdf`,
    query
  );
  return response;
};
