import { api } from "./apiClient";

export const walletService = {
  getWallets: ({ skip, limit, search }) =>
    api.get("/api/wallets", { skip, limit, search }),

  getWalletByUserId: (userId) =>
    api.get(`/api/wallets/users/${userId}`),

  getWalletTransactions: (walletId, { skip, limit }) =>
    api.get(`/api/wallets/${walletId}/transactions`, { skip, limit }),

  addBalance: ({ userId, amount, description }) =>
    api.post(`/api/wallets/users/${userId}/add-balance`, { amount, description }),

  withdraw: ({ userId, amount, description }) =>
    api.post(`/api/wallets/users/${userId}/withdraw`, { amount, description }),

  updateStatus: ({ userId, status }) =>
    api.patch(`/api/wallets/users/${userId}/status`, { status }),

  transfer: ({ fromDriverProfileId, toDriverProfileId, amount, description }) =>
    api.post("/api/wallets/drivers/transfer", { fromDriverProfileId, toDriverProfileId, amount, description }),
};
