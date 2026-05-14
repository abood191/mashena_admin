import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { appSettingsService } from "../../services/appSettings.service";

/**
 * Structured query keys for App Settings.
 */
export const appSettingsKeys = {
  all: ["settings"],
  lists: () => [...appSettingsKeys.all, "list"],
  list: (filters) => [...appSettingsKeys.lists(), { filters }],
};

/**
 * Hook to fetch all app settings.
 */
export const useAppSettings = (filters = {}) => {
  return useQuery({
    queryKey: appSettingsKeys.list(filters),
    queryFn: () => appSettingsService.list(filters),
    select: (res) => {
      const data = Array.isArray(res) ? res : res?.data || [];
      const count = res?.count || data.length;
      return { data, count };
    },
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to update a specific app setting.
 */
export const useUpdateAppSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }) => appSettingsService.updateSetting({ key, value }),
    onSuccess: () => {
      // Invalidate settings cache
      queryClient.invalidateQueries({ queryKey: appSettingsKeys.lists() });
    },
  });
};
