import {
  CURRENT_ANUNCIO_URI,
  type AddType,
  type AnuncioViewResponseDTO,
} from "../anuncios/anuncio";
import { CURRENT_SALES_URI } from "../ventas/sales";
import { getBlobFromApi, postBlobToApi } from "~/utils/plainFetch";

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

export interface SnackSalesByCinemaLineDTO {
  snackId: string;
  totalQuantity: number;
  snackName: string;
}

export interface SnackReportByCinemaReportDTO {
  snacks: SnackSalesByCinemaLineDTO[];
  totalQuantity: number;
  cinema: CinemaView;
  from: string;
  to: string;
  cinemaId: string;
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
      method: "GET",
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

// --- Interfaces for 'boletos vendidos' report
export interface CinemaSimpleDTO {
  id: string;
  name: string;
}

export interface MovieSimpleDTO {
  id: string;
  title: string;
}

export interface ShowtimeReportDTO {
  hallId: string;
  hallName: string;
  cinema: CinemaSimpleDTO;
  // ISO 8601 date-time strings
  startTime: string;
  endTime: string;
  ticketsAvailable: number;
}

export interface FunctionReportDTO {
  functionId: string;
  cinemaId: string;
  cinemaRoomId: string;
  movieId: string;
  ticketsSold: number;
  showtime: ShowtimeReportDTO;
  movie: MovieSimpleDTO;
}

export interface TicketsSoldReportDTO {
  from: string; // ISO date (e.g. "2025-10-01")
  to: string; // ISO date (e.g. "2025-11-29")
  totalTickets: number;
  functions: FunctionReportDTO[];
}

export interface TicketsSoldReportQuery {
  from: string; // ISO date (e.g. "2025-10-01")
  to: string; // ISO date (e.g. "2025-11-29")
}

export const reportDeBoletosVendidos = async (
  query: TicketsSoldReportQuery
): Promise<TicketsSoldReportDTO> => {
  const response = await $api<TicketsSoldReportDTO>(
    `${CURRENT_SALES_URI}/reports/sales/tickets`,
    {
      method: "GET",
      params: query,
    }
  );
  return response;
};

export const reportDeBoletosVendidosPdf = async (
  query: TicketsSoldReportQuery
): Promise<Blob> => {
  const response = await getBlobFromApi(
    `${CURRENT_SALES_URI}/reports/sales/tickets/pdf`,
    query
  );
  return response;
};

// Top de cines con mayor volumen de ventas en un periodo
// --- Interfaces for 'ventas por cine' report
export interface CinemaSalesLineDTO {
  cinemaId: string; // UUID
  cinemaName: string;
  totalAmount: number; // monetary amount
  totalSales: number; // number of sales
}

export interface CinemaSalesReportDTO {
  from: string; // ISO date (e.g. "2025-10-01")
  to: string; // ISO date (e.g. "2025-11-29")
  cinemas: CinemaSalesLineDTO[];
}

export interface CinemaSalesReportQuery {
  from: string; // ISO date (e.g. "2025-10-01")
  to: string; // ISO date (e.g. "2025-11-29")
  limit?: number; // optional limit of top cinemas
}

export const reportDeVentasPorCine = async (
  query: CinemaSalesReportQuery
): Promise<CinemaSalesReportDTO> => {
  const response = await $api<CinemaSalesReportDTO>(
    `${CURRENT_SALES_URI}/reports/sales/cinemas/top`,
    {
      method: "GET",
      params: query,
    }
  );
  return response;
};

export const reportDeVentasPorCinePdf = async (
  query: CinemaSalesReportQuery
): Promise<Blob> => {
  const response = await getBlobFromApi(
    `${CURRENT_SALES_URI}/reports/sales/cinemas/top/pdf`,
    query
  );
  return response;
};
