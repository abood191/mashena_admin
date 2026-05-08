import { getToken } from "../auth/auth";

const BASE_URL = "http://localhost:3000";

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
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/driver-documents/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error("Failed to fetch document");
    return res.json();
  },

  getAllByDriver: async (driverProfileId) => {
    const token = getToken();
    const res = await fetch(
      `${BASE_URL}/api/driver-documents/driver-profile/${driverProfileId}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch documents");
    return res.json();
  },

  upload: async ({ driverProfileId, docType, issuedAt, expiresAt, file }) => {
    const token = getToken();

    const fd = new FormData();
    fd.append("driverProfileId", driverProfileId);
    fd.append("docType", docType);
    if (issuedAt) fd.append("issuedAt", toISO(issuedAt));
    if (expiresAt) fd.append("expiresAt", toISO(expiresAt));
    fd.append("file", file);

    const res = await fetch(`${BASE_URL}/api/driver-documents`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fd,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Upload failed");
    }

    return res.json();
  },

  update: async (id, { issuedAt, expiresAt, file }) => {
    const token = getToken();

    const fd = new FormData();
    if (issuedAt) fd.append("issuedAt", toISO(issuedAt));
    if (expiresAt) fd.append("expiresAt", toISO(expiresAt));
    if (file) fd.append("file", file);

    const res = await fetch(`${BASE_URL}/api/driver-documents/${id}`, {
      method: "PATCH",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fd,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Update failed");
    }

    return res.json();
  },
};
