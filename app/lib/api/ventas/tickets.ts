export const CURRENT_TICKETS_URI = "/v1/tickets";


export interface TicketResponseDTO {
	id: string; // UUID
	saleLineTicketId: string; // UUID
	cinemaFunctionId: string; // UUID
	cinemaId: string; // UUID
	cinemaRoomId: string; // UUID
	movieId: string; // UUID
	used: boolean | null;
	// ISO 8601 date-time strings, e.g. "2025-10-31T14:00:00"
	createdAt: string | null;
	updatedAt: string | null;
}


export const getTicketById = async (
  id: string
): Promise<TicketResponseDTO> => {
  const response = await $api<TicketResponseDTO>(
    `${CURRENT_TICKETS_URI}/${id}`
  );
  return response;
};

export const markTicketAsUsed = async (
  id: string
): Promise<TicketResponseDTO> => {
  const response = await $api<TicketResponseDTO>(
    `${CURRENT_TICKETS_URI}/mark-used/${id}`,
    {
      method: "PATCH",
    }
  );
  return response;
}


export interface QtySeatsOccupiedResponseDTO {
  quantity: number;
}

export const getQuantitySeatsOccupied = async (
  cinemaFunctionId: string
): Promise<QtySeatsOccupiedResponseDTO> => {
  const response = await $api<QtySeatsOccupiedResponseDTO>(
    `${CURRENT_TICKETS_URI}/public/cinema-function/${cinemaFunctionId}/seats/occupied/qty`
  );
  return response;
}