import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { couponsService } from "../../services/coupons.service";

/* ─── Query Key Factory ─────────────────────────────────────────── */
export const couponKeys = {
  all: ["coupons"],
  list: (filters) => [...couponKeys.all, "list", { filters }],
  detail: (id) => [...couponKeys.all, "detail", id],
  globalHistory: (filters) => [...couponKeys.all, "globalHistory", { filters }],
  couponHistory: (id, filters) => [...couponKeys.all, "history", id, { filters }],
  userCoupons: (userId, filters) => [...couponKeys.all, "user", userId, { filters }],
};

/* ─── Queries ───────────────────────────────────────────────────── */

/** List all coupons with pagination & filters. */
export const useCoupons = (filters = {}, options = {}) =>
  useQuery({
    queryKey: couponKeys.list(filters),
    queryFn: () => couponsService.getCoupons(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });

/** Get a single coupon by ID. */
export const useCouponById = (id, options = {}) =>
  useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => couponsService.getCouponById(id),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });

/** Get the global usage history. */
export const useGlobalCouponHistory = (filters = {}, options = {}) =>
  useQuery({
    queryKey: couponKeys.globalHistory(filters),
    queryFn: () => couponsService.getGlobalHistory(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });

/** Get history for a specific coupon. */
export const useCouponHistory = (id, filters = {}, options = {}) =>
  useQuery({
    queryKey: couponKeys.couponHistory(id, filters),
    queryFn: () => couponsService.getCouponHistory(id, filters),
    enabled: !!id,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });

/** Get coupons owned by a specific user. */
export const useUserCoupons = (userId, filters = {}, options = {}) =>
  useQuery({
    queryKey: couponKeys.userCoupons(userId, filters),
    queryFn: () => couponsService.getUserCoupons(userId, filters),
    enabled: !!userId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });

/* ─── Mutations ─────────────────────────────────────────────────── */

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => couponsService.createCoupon(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: couponKeys.all }),
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => couponsService.updateCoupon(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: couponKeys.all }),
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => couponsService.deleteCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: couponKeys.all }),
  });
};
