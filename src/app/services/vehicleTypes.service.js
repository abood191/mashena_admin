import { api } from "./apiClient";

export const vehicleTypesService = {
  getAll: () => api.get("/api/vehicle-types"),

  create: (formData) =>
    api.post("/api/vehicle-types", formData, { isFormData: true }),

  update: (id, data, isFormData = false) => {
    if (isFormData) {
      return api.patch(`/api/vehicle-types/${id}`, data, { isFormData });
    }
    return api.patch(`/api/vehicle-types/${id}`, data, { isFormData });
  },

  remove: (id) => api.del(`/api/vehicle-types/${id}`),
};
