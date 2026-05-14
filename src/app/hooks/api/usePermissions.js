import { useQuery } from "@tanstack/react-query";
import { permissionsService } from "../../services/permissions.service";

export const permissionKeys = {
  all: ["permissions"],
  lists: () => [...permissionKeys.all, "list"],
  list: (filters) => [...permissionKeys.lists(), { filters }],
};

export const usePermissions = (filters = { skip: 0, limit: 1000 }) => {
  return useQuery({
    queryKey: permissionKeys.list(filters),
    queryFn: () => permissionsService.list(filters),
    staleTime: 1000 * 60 * 60, // Permissions rarely change, cache for an hour
  });
};
