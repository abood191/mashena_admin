import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../../services/notification.service";
import { toast } from "sonner";

export const useRegisterFCMToken = () => {
  return useMutation({
    mutationFn: notificationService.registerToken,
  });
};

export const useRemoveFCMToken = () => {
  return useMutation({
    mutationFn: notificationService.removeToken,
  });
};

export const useNotifications = (options = {}) => {
  return useQuery({
    queryKey: ["notifications", options],
    queryFn: () => notificationService.getNotifications(options),
    refetchInterval: 30_000,        // Poll every 30 seconds
    refetchIntervalInBackground: false, // Stop polling when tab is hidden
  });
};

export const useAdminNotificationHistory = (options = {}) => {
  return useQuery({
    queryKey: ["admin_notifications_history", options],
    queryFn: () => notificationService.getAdminNotificationHistory(options),
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useSendAdminNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.sendAdminNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_notifications_history"] });
    },
  });
};
