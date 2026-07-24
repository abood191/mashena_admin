import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { walletService } from "../../services/wallet.service";

export const walletKeys = {
  all: ["wallets"],
  lists: () => [...walletKeys.all, "list"],
  list: (filters) => [...walletKeys.lists(), { filters }],
  details: () => [...walletKeys.all, "detail"],
  detail: (id) => [...walletKeys.details(), id],
  transactions: (id) => [...walletKeys.all, "transactions", id],
  transactionList: (id, filters) => [...walletKeys.transactions(id), { filters }],
};

export const useWallets = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: walletKeys.list(filters),
    queryFn: () => walletService.getWallets(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
};

export const useWallet = (userId, options = {}) => {
  return useQuery({
    queryKey: walletKeys.detail(userId),
    queryFn: () => walletService.getWalletByUserId(userId),
    enabled: !!userId,
    ...options,
  });
};

export const useWalletTransactions = (walletId, filters = {}, options = {}) => {
  return useQuery({
    queryKey: walletKeys.transactionList(walletId, filters),
    queryFn: () => walletService.getWalletTransactions(walletId, filters),
    enabled: !!walletId,
    placeholderData: keepPreviousData,
    ...options,
  });
};

export const useAddBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => walletService.addBalance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
};

export const useWithdraw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => walletService.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
};

export const useUpdateWalletStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => walletService.updateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
};

export const useTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => walletService.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
};
