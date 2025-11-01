// TYPES AND INTERFACES FOR WALLET MANAGEMENT
export enum OwnerType {
  CINEMA = "CINEMA",
  CUSTOMER = "CUSTOMER",
}

export interface CreateWalletDTO {
  ownerId: string;
  ownerType: OwnerType;
}

export interface RechargeWalletRequest {
  amount: number;
}

export interface Wallet {
  id: string;
  balance: number;
  ownerId: string;
  ownerType: OwnerType;
}

// BASE URL FOR WALLET MANAGEMENT

export const CURRENT_WALLET_URL = "/v1/wallets";

// ENPOINTS FOR WALLET MANAGEMENT

export const createWallet = async (data: CreateWalletDTO): Promise<Wallet> => {
  const response = await $api<Wallet>(`${CURRENT_WALLET_URL}`, {
    method: "POST",
    body: data,
  });
  return response;
};

export const getWalletByOwner = async (ownerId: string): Promise<Wallet> => {
  const response = await $api<Wallet>(`${CURRENT_WALLET_URL}/${ownerId}`, {
    method: "GET",
  });
  return response;
};

export const rechargeWallet = async (
  ownerId: string,
  body: RechargeWalletRequest
): Promise<Wallet> => {
  const response = await $api<Wallet>(
    `${CURRENT_WALLET_URL}/${ownerId}/recharge`,
    {
      method: "POST",
      body: body,
    }
  );
  return response;
};
