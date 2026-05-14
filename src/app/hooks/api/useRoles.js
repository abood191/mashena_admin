import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { rolesService } from "../../services/roles.service";

export const roleKeys = {
  all: ["roles"],
  lists: () => [...roleKeys.all, "list"],
  list: (filters) => [...roleKeys.lists(), { filters }],
  permissions: (roleId) => [...roleKeys.all, roleId, "permissions"],
};

export const useRoles = (filters = {}) => {
  return useQuery({
    queryKey: roleKeys.list(filters),
    queryFn: () => rolesService.list(filters),
    placeholderData: keepPreviousData,
  });
};

export const useRolePermissions = (roleId) => {
  return useQuery({
    queryKey: roleKeys.permissions(roleId),
    queryFn: () => rolesService.getRolePermissions({ roleId }),
    enabled: !!roleId,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => rolesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => rolesService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => rolesService.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
};

export const useSetRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }) => rolesService.setRolePermissions({ roleId, permissionIds }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.permissions(variables.roleId) });
    },
  });
};
