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
};

/**
 * Hook to fetch the list of drivers.
 * Uses keepPreviousData for smooth pagination.
 */
export const useDrivers = (filters = {}) => {
  return useQuery({
    queryKey: userKeys.driverList(filters),
    queryFn: () => userService.getDrivers(filters),
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch the list of riders.
 * Uses keepPreviousData for smooth pagination.
 */
export const useRiders = (filters = {}) => {
  return useQuery({
    queryKey: userKeys.riderList(filters),
    queryFn: () => userService.getRiders(filters),
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch the list of admins.
 * Uses keepPreviousData for smooth pagination.
 */
export const useAdmins = (filters = {}) => {
  return useQuery({
    queryKey: userKeys.adminList(filters),
    queryFn: () => userService.getAdmins(filters),
    placeholderData: keepPreviousData,
  });
};
