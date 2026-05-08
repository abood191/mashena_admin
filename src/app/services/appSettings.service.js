import { api } from "./apiClient";

export const appSettingsService = {
  list: () => api.get("/api/app-settings"),
  
  updateSetting: ({ key, value }) =>
    api.post("/api/app-settings", { key, value }),
};
