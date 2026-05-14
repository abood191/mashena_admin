import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { driverRequestsService } from "../../services/driverRequests.service";

/**
 * Centralized query keys for Driver Requests.
 * Parameterized to ensure cache-per-query-state (search, pagination, status filter).
 */
export const driverRequestKeys = {
  all: ["driverRequests"],
  lists: () => [...driverRequestKeys.all, "list"],
  list: (filters) => [...driverRequestKeys.lists(), { filters }],
  details: () => [...driverRequestKeys.all, "detail"],
  detail: (id) => [...driverRequestKeys.details(), id],
};

/**
 * Hook to fetch the paginated, searchable list of driver approval requests.
 */
export const useDriverRequests = ({ skip = 0, limit = 10, search = "", status = "" } = {}) => {
  return useQuery({
    queryKey: driverRequestKeys.list({ skip, limit, search, status }),
    queryFn: () => driverRequestsService.getAll({ skip, limit, search, status }),
    placeholderData: keepPreviousData,
    select: (res) => {
      const data = Array.isArray(res) ? res : res?.data || [];
      const count = res?.count ?? data.length;
      return { data, count };
    },
  });
};

/**
 * Hook to fetch a single driver request by ID.
 * staleTime: 30s — details are moderately volatile (status changes, doc updates).
 */
export const useDriverRequest = (id) => {
  return useQuery({
    queryKey: driverRequestKeys.detail(id),
    queryFn: () => driverRequestsService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 30,
    select: (res) => (res?.data ? res.data : res),
  });
};

/**
 * Hook to approve a driver request.
 * Invalidates both the specific detail and the list so the status updates everywhere.
 */
export const useApproveDriverRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => driverRequestsService.approve(id, payload),
    onSuccess: (_, variables) => {
      // Precise invalidation — only the detail that changed + the list
      queryClient.invalidateQueries({ queryKey: driverRequestKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: driverRequestKeys.lists() });
    },
  });
};

/**
 * Hook to reject a driver request.
 */
export const useRejectDriverRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }) => driverRequestsService.reject(id, { rejectionReason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: driverRequestKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: driverRequestKeys.lists() });
    },
  });
};
