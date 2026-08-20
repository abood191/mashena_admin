import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../../services/notification.service";

export const notificationKeys = {
  all: ["notifications"],
  list: (filters) => [...notificationKeys.all, { filters }],
};

export const useNotifications = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationService.getNotifications(filters),
    ...options,
  });
};

export const useRegisterFCMToken = () => {
  return useMutation({
    mutationFn: (payload) => notificationService.registerToken(payload),
  });
};

export const useRemoveFCMToken = () => {
  return useMutation({
    mutationFn: (payload) => notificationService.removeToken(payload),
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
