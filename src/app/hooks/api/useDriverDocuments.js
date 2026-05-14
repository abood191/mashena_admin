import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { driverDocumentsService } from "../../services/driverDocuments.service";

/**
 * Centralized query keys for Driver Documents.
 * Scoped to driverProfileId to keep cache separation clean.
 */
export const driverDocumentKeys = {
  all: ["driverDocuments"],
  byDriver: (driverProfileId) => [...driverDocumentKeys.all, "driver", driverProfileId],
  detail: (id) => [...driverDocumentKeys.all, "detail", id],
};

/**
 * Hook to fetch all documents for a specific driver profile.
 * - enabled: only fetches when driverProfileId is valid
 * - staleTime: 60s — documents are stable between uploads but can change
 * - select: normalizes the response shape (array or {data: []})
 */
export const useDriverDocuments = (driverProfileId) => {
  return useQuery({
    queryKey: driverDocumentKeys.byDriver(driverProfileId),
    queryFn: () => driverDocumentsService.getAllByDriver(driverProfileId),
    enabled: !!driverProfileId,
    staleTime: 1000 * 60,
    select: (res) => {
      const data = Array.isArray(res) ? res : res?.data || [];
      return data;
    },
  });
};

/**
 * Hook to upload a new driver document (FormData).
 * Invalidates only the specific driver's documents — not the entire cache.
 */
export const useUploadDriverDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params) => driverDocumentsService.upload(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: driverDocumentKeys.byDriver(variables.driverProfileId),
      });
    },
  });
};

/**
 * Hook to update an existing driver document (FormData).
 * Invalidates only the specific driver's documents by driverProfileId.
 */
export const useUpdateDriverDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => driverDocumentsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: driverDocumentKeys.byDriver(variables.driverProfileId),
      });
    },
  });
};
