import { api } from "./apiClient";

export const appSettingsService = {
  list: ({ skip = 0, limit = 50, search = "" } = {}) => 
    api.get("/api/app-settings", { skip, limit, search }),
  
  updateSetting: ({ key, value }) =>
    api.post("/api/app-settings", { key, value }),
};
