export const CURRENT_SNACKS_URI = "/v1/snacks";
export interface SnackView {
  id: string;
  cinemaId: string;
  name: string;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}
