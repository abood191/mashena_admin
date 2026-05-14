import { api } from "./apiClient";

const toISO = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch (e) {
    return null;
  }
};

export const driverDocumentsService = {
  getById: async (id) => {
    return api.get(`/api/driver-documents/${id}`);
  },

  getAllByDriver: async (driverProfileId) => {
    return api.get(`/api/driver-documents/driver-profile/${driverProfileId}`);
  },

  upload: async ({ driverProfileId, docType, issuedAt, expiresAt, file }) => {
    const fd = new FormData();
    fd.append("driverProfileId", driverProfileId);
    fd.append("docType", docType);
    if (issuedAt) fd.append("issuedAt", toISO(issuedAt));
    if (expiresAt) fd.append("expiresAt", toISO(expiresAt));
    fd.append("file", file);

    return api.post("/api/driver-documents", fd, { isFormData: true });
  },

  update: async (id, { issuedAt, expiresAt, file }) => {
    const fd = new FormData();
    if (issuedAt) fd.append("issuedAt", toISO(issuedAt));
    if (expiresAt) fd.append("expiresAt", toISO(expiresAt));
    if (file) fd.append("file", file);

    return api.patch(`/api/driver-documents/${id}`, fd, { isFormData: true });
  },
};
