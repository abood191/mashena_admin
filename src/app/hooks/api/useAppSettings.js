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
      const skip = filters.skip ?? 0;
      const limit = filters.limit ?? 10;
      const search = filters.search ?? "";

      // 1. Extract raw items array
      let allItems = [];
      if (Array.isArray(res)) {
        allItems = res;
      } else if (Array.isArray(res?.data)) {
        allItems = res.data;
      } else if (Array.isArray(res?.items)) {
        allItems = res.items;
      } else if (Array.isArray(res?.settings)) {
        allItems = res.settings;
      } else if (res && typeof res === "object") {
        const entries = Object.entries(res).filter(
          ([k]) => k !== "count" && k !== "total" && k !== "meta" && k !== "status"
        );
        if (entries.length > 0) {
          allItems = entries.map(([k, v]) => {
            if (v && typeof v === "object" && "value" in v) {
              return { key: k, ...v };
            }
            return { key: k, value: String(v) };
          });
        }
      }

      // 2. Extract server total if explicitly returned by backend
      const serverTotal = res?.count ?? res?.total ?? res?.meta?.total ?? res?.meta?.count ?? res?.totalCount;

      if (typeof serverTotal === "number") {
        return { data: allItems, count: serverTotal };
      }

      // 3. Fallback: If server returned full list without server-side pagination/filtering
      let filtered = allItems;
      if (search && typeof search === "string" && search.trim()) {
        const query = search.trim().toLowerCase();
        filtered = allItems.filter((item) => {
          const k = String(item?.key || "").toLowerCase();
          const v = String(item?.value || "").toLowerCase();
          return k.includes(query) || v.includes(query);
        });
      }

      const count = filtered.length;
      const data = (allItems.length > limit || skip > 0)
        ? filtered.slice(skip, skip + limit)
        : filtered;

      return { data, count };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
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
