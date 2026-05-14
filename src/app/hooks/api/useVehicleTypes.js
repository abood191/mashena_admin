import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleTypesService } from "../../services/vehicleTypes.service";

/**
 * Structured query keys for Vehicle Types.
 * This pattern ensures that cache invalidation is precise and scalable.
 */
export const vehicleTypeKeys = {
  all: ["vehicleTypes"],
  lists: () => [...vehicleTypeKeys.all, "list"],
  list: (filters) => [...vehicleTypeKeys.lists(), { filters }],
  details: () => [...vehicleTypeKeys.all, "detail"],
  detail: (id) => [...vehicleTypeKeys.details(), id],
};

/**
 * Hook to fetch the list of vehicle types.
 * @param {Object} filters - Optional filters like skip, limit, search.
 */
export const useVehicleTypes = (filters = {}) => {
  return useQuery({
    queryKey: vehicleTypeKeys.list(filters),
    queryFn: () => vehicleTypesService.getAll(filters),
    // If the API always returns an object with a 'data' array, we can use select to extract it directly.
    // select: (res) => res?.data || [],
  });
};

/**
 * Hook to create a new vehicle type.
 */
export const useCreateVehicleType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => vehicleTypesService.create(data),
    onSuccess: () => {
      // Invalidate the lists cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: vehicleTypeKeys.lists() });
    },
  });
};

/**
 * Hook to update an existing vehicle type.
 */
export const useUpdateVehicleType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, isFormData }) => vehicleTypesService.update(id, data, isFormData),
    onSuccess: (_, variables) => {
      // Invalidate lists and the specific detail cache
      queryClient.invalidateQueries({ queryKey: vehicleTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleTypeKeys.detail(variables.id) });
    },
  });
};

/**
 * Hook to delete a vehicle type.
 */
export const useDeleteVehicleType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => vehicleTypesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleTypeKeys.lists() });
    },
  });
};
