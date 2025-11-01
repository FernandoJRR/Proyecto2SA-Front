import type { Page } from "../utils/paginated";
import type { SnackResponseDTO } from "./snacks";
import type { TicketResponseDTO } from "./tickets";

export const CURRENT_SALES_URI = "/v1/sales";

export enum SaleStatusType{
    PENDING = "PENDING",
    PAID = "PAID",
    PAID_ERROR = "PAID_ERROR",
    CANCELLED = "CANCELLED"
}

export interface SaleLineSnackResponseDTO {
  id: string; // UUID
  saleId: string; // UUID
  snackId: string; // UUID
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  snack: SnackResponseDTO;
}

export interface SaleLineTicketResponseDTO {
  id: string; // UUID
  saleId: string; // UUID
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: string; // ISO 8601 date-time string
  updatedAt: string; // ISO 8601 date-time string
  ticketView: TicketResponseDTO;
}

export interface SaleResponseDTO {
  id: string; // UUID
  clientId: string; // UUID
  cinemaId: string; // UUID
  totalAmount: number;
  claimedAmount: number;
  discountedAmount: number;
  status: SaleStatusType;
  createdAt: string; // ISO 8601 date-time string
  updatedAt: string; // ISO 8601 date-time string
  paidAt: string | null; // ISO 8601 date-time string
  saleLineSnacks: SaleLineSnackResponseDTO[];
  saleLineTickets: SaleLineTicketResponseDTO[];
}

export interface CreateSaleLineSnackDTO {
  snackId: string; // UUID
  quantity: number;
}

export interface CreateSaleLineTicketDTO {
  cinemaFunctionId: string;
}

export interface CreateSaleDTO {
  clientId: string; // UUID
  cinemaId: string; // UUID
  snacks: CreateSaleLineSnackDTO[];
  tickets: CreateSaleLineTicketDTO[];
}

export type SalePage = Page<SaleResponseDTO>;

export const createSale = async (
  data: CreateSaleDTO
): Promise<SaleResponseDTO> => {
  return $api<SaleResponseDTO>(`${CURRENT_SALES_URI}`, {
    method: "POST",
    body: data,
  });
}

export const getSaleById = async (
  id: string
): Promise<SaleResponseDTO> => {
  return $api<SaleResponseDTO>(`${CURRENT_SALES_URI}/${id}`, {
    method: "GET",
  });
}

export const getSalesByCinema = async (
  cinemaId: string,
  page: number = 0
): Promise<SalePage> => {
  return $api<SalePage>(
    `${CURRENT_SALES_URI}/cinema/${cinemaId}`,
    {
      method: "GET",
      params: { page },
    }
  );
}


export const getSalesByClient = async (
  clientId: string,
  page: number = 0
): Promise<SalePage> => {
  return $api<SalePage>(`${CURRENT_SALES_URI}/customer/${clientId}`, {
    method: "GET",
    params: { page },
  });
};

export const getAllSales = async (page: number = 0): Promise<SalePage> => {
  return $api<SalePage>(`${CURRENT_SALES_URI}/all`, {
    method: "GET",
    params: { page },
  });
};

export const claimTicketMoney = async (
    saleLineTicketId: string
): Promise<SaleResponseDTO> => {
  return $api<SaleResponseDTO>(
    `${CURRENT_SALES_URI}/claim/sale-line-ticket/${saleLineTicketId}`,
    {
      method: "POST",
    }
  );
}

export const retrySale = async (
    saleId: string
): Promise<SaleResponseDTO> => {
  return $api<SaleResponseDTO>(
    `${CURRENT_SALES_URI}/retry/sale/${saleId}`,
    {
      method: "POST",
    }
  );
}
