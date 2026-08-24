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
  return useMutation({
    mutationFn: notificationService.sendAdminNotification,
    onSuccess: () => {
      toast.success("تم إرسال الإشعار بنجاح");
    },
    onError: () => {
      toast.error("فشل في إرسال الإشعار");
    },
  });
};
