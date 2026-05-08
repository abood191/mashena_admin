import React from "react";
import { useTranslation } from "react-i18next";

export function RequestInfo({ request }) {
  const { t } = useTranslation("common");
  if (!request) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-lg font-semibold">{t("requestDetails.driverInfo")}</h2>
        <span className="px-3 py-1 rounded-full bg-white/5 text-white/70 text-xs border border-white/10 italic">
          Verified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoItem label={t("requestDetails.fields.fullName")} value={request.fullName || "Loading..."} />
          <InfoItem label={t("requestDetails.fields.nationalId")} value={request.nationalIdNumber} />
          <InfoItem label={t("requestDetails.fields.license")} value={request.driverLicenseNumber} />
        </div>
        <div className="space-y-4">
          <InfoItem label={t("requestDetails.fields.city")} value={request.city || "Not specified"} />
          <InfoItem label={t("requestDetails.fields.plate")} value={request.vehiclePlateNumber} />
          <InfoItem label={t("requestDetails.fields.status")} value={t(`drivers.statuses.${request.status?.toLowerCase()}`) || request.status} statusColor={getStatusColor(request.status)} />
        </div>
      </div>

      {request.vehiclePhotoUrl && (
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="text-white/40 text-xs mb-3 uppercase tracking-wider font-semibold">Vehicle Photo</div>
          <div className="relative group w-48 h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
             <img
              src={request.vehiclePhotoUrl}
              alt="Vehicle"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, statusColor }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-white/40 text-xs uppercase tracking-wider font-medium">{label}</span>
      <span className={`text-white font-medium ${statusColor || ""}`}>{value || "—"}</span>
    </div>
  );
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'approved': return 'text-green-400';
    case 'rejected': return 'text-red-400';
    case 'pending':
    case 'submitted': return 'text-yellow-400';
    default: return 'text-white/80';
  }
}
