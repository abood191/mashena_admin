import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { userService } from "../../services/user.service";

/**
 * Structured query keys for Users (Drivers, Riders, Admins).
 */
export const userKeys = {
  all: ["users"],
  
  drivers: () => [...userKeys.all, "drivers"],
  driverList: (filters) => [...userKeys.drivers(), { filters }],
  
  riders: () => [...userKeys.all, "riders"],
  riderList: (filters) => [...userKeys.riders(), { filters }],
  
  admins: () => [...userKeys.all, "admins"],
  adminList: (filters) => [...userKeys.admins(), { filters }],

  accredited: () => [...userKeys.all, "accredited"],
  accreditedList: (filters) => [...userKeys.accredited(), { filters }],
};

/**
 * Hook to fetch the list of drivers.
 * Uses keepPreviousData for smooth pagination.
 */
export const useDrivers = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: userKeys.driverList(filters),
    queryFn: () => userService.getDrivers(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
};

/**
 * Hook to fetch the list of riders.
 * Uses keepPreviousData for smooth pagination.
 */
export const useRiders = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: userKeys.riderList(filters),
    queryFn: () => userService.getRiders(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
};

/**
 * Hook to fetch the list of admins.
 * Uses keepPreviousData for smooth pagination.
 */
export const useAdmins = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: userKeys.adminList(filters),
    queryFn: () => userService.getAdmins(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
};

/**
 * Hook to fetch the list of accredited users.
 * Uses keepPreviousData for smooth pagination.
 */
export const useAccredited = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: userKeys.accreditedList(filters),
    queryFn: () => userService.getAccredited(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
};

/**
 * Hook to create a new employee (Admin)
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => userService.createEmployee(data),
    onSuccess: () => {
      // Invalidate the admins list so the new employee shows up immediately
      queryClient.invalidateQueries({ queryKey: userKeys.admins() });
    },
  });
};

/**
 * Hook to create a new accredited user
 */
export const useCreateAccredited = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => userService.createAccredited(data),
    onSuccess: () => {
      // Invalidate the accredited list so the new user shows up immediately
      queryClient.invalidateQueries({ queryKey: userKeys.accredited() });
    },
  });
};

/**
 * Hooks to fetch individual users by ID
 */
export const useDriver = (id) => {
  return useQuery({
    queryKey: [...userKeys.drivers(), "detail", id],
    queryFn: () => userService.getDriverById(id),
    enabled: !!id,
  });
};

export const useRider = (id) => {
  return useQuery({
    queryKey: [...userKeys.riders(), "detail", id],
    queryFn: () => userService.getRiderById(id),
    enabled: !!id,
  });
};

export const useAdmin = (id) => {
  return useQuery({
    queryKey: [...userKeys.admins(), "detail", id],
    queryFn: () => userService.getAdminById(id),
    enabled: !!id,
  });
};

export const useAccreditedUser = (id) => {
  return useQuery({
    queryKey: [...userKeys.accredited(), "detail", id],
    queryFn: () => userService.getAccreditedById(id),
    enabled: !!id,
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      // Invalidate all user lists
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
