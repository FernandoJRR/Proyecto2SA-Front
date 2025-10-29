import {
  CURRENT_ANUNCIO_URI,
  type AddType,
  type AnuncioViewResponseDTO,
} from "../anuncios/anuncio";
import { CURRENT_SALES_URI } from "../ventas/sales";
import type { SnackView } from "../ventas/snacks";

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
      body: query,
    }
  );
  return response;
};

export const anunciosCompradosPdf = async (
  query: AnunciosComradosQuery
): Promise<Blob> => {
  const response = await postBlobToApi(
    `${CURRENT_ANUNCIO_URI}/report/bought/pdf`,
    undefined,
    query
  );
  return response;
};

export interface GananciasAnuncianteQuery {
  from: string; // ISO date time string e.g. 2025-10-01
  to: string; // ISO date time string e.g. 2025-10-31
  userId?: string; // UUID of the user who is the advertiser - optional
}

export interface AddGananciasAnuncianteReportLineDTO {
  id: string; // UUID of the anuncio
  type: AddType;
  paidAt: string; // ISO date time string
  price: number; // in the currency unit
  addExpiration: string; // ISO date time string
  userFullName: string;
}

export interface GananciasAnuncianteReportDTO {
  adds: AddGananciasAnuncianteReportLineDTO[];
  totalGanancias: number;
}

export const gananciasAnunciante = async (
  query: GananciasAnuncianteQuery
): Promise<GananciasAnuncianteReportDTO> => {
  const response = await $api<GananciasAnuncianteReportDTO>(
    `${CURRENT_ANUNCIO_URI}/report/ganancias-anunciante`,
    {
      method: "POST",
      body: query,
    }
  );
  return response;
};

export const gananciasAnunciantePdf = async (
  query: GananciasAnuncianteQuery
): Promise<Blob> => {
  const response = await postBlobToApi(
    `${CURRENT_ANUNCIO_URI}/report/ganancias-anunciante/pdf`,
    undefined,
    query
  );
  return response;
};

// -------------------------------------------------------------------
// Snacks Sales by Cinema Report
export interface CinemaView {
  id: string;
  name: string;
}

export interface SnackSalesByCinemaDTO {
  cinemaId: string;
  snackId: string;
  totalQuantity: number;
  totalAmount: number;
  snack: SnackView;
}

export interface SnackReportByCinemaReportDTO {
  snackSalesByCinemaDTOs: SnackSalesByCinemaDTO[];
  totalAmount: number;
  cinema: CinemaView;
  from: string;
  to: string;
}

export interface SnackSalesByCinemaQuery {
  from: string; // ISO date time string e.g. 2025-10-01
  to: string; // ISO date time string e.g. 2025-10-31
}

export const snackSalesByCinemaReport = async (
  cinemaId: string,
  query: SnackSalesByCinemaQuery
): Promise<SnackReportByCinemaReportDTO> => {
  const response = await $api<SnackReportByCinemaReportDTO>(
    `${CURRENT_SALES_URI}/reports/sales/snacks/cinema/${cinemaId}`,
    {
      method: "POST",
      params: query,
    }
  );
  return response;
};

export const snackSalesByCinemaReportPdf = async (
  cinemaId: string,
  query: SnackSalesByCinemaQuery
): Promise<Blob> => {
  const response = await postBlobToApi(
    `${CURRENT_SALES_URI}/reports/sales/snacks/cinema/${cinemaId}/pdf`,
    query
  );
  return response;
};
