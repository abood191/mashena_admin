import React from "react";
import { useTranslation } from "react-i18next";

export function VehicleForm({ form, setForm, vehicleTypes }) {
  const { t } = useTranslation("common");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-lg font-semibold">{t("requestDetails.vehicleSetup")}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Vehicle Type */}
        <div className="space-y-2">
          <label className="text-white/60 text-sm font-medium ml-1">{t("requestDetails.fields.vehicleType")}</label>
          <select
            name="vehicleTypeId"
            value={form.vehicleTypeId}
            onChange={handleChange}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#4880FF]/50 transition-all cursor-pointer appearance-none text-sm"
          >
            <option value="" className="bg-[#0b1220]">{t("requestDetails.fields.vehicleType")}</option>
            {vehicleTypes.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0b1220]">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Plate Number */}
        <div className="space-y-2">
          <label className="text-white/60 text-sm font-medium ml-1">{t("requestDetails.fields.plate")}</label>
          <input
            name="plateNumber"
            placeholder="e.g. ABC-1234"
            value={form.plateNumber}
            onChange={handleChange}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/50 text-sm"
          />
        </div>

        {/* Model */}
        <div className="space-y-2">
          <label className="text-white/60 text-sm font-medium ml-1">{t("requestDetails.fields.model")}</label>
          <input
            name="model"
            placeholder="e.g. Toyota Camry"
            value={form.model}
            onChange={handleChange}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/50 text-sm"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <label className="text-white/60 text-sm font-medium ml-1">{t("requestDetails.fields.color")}</label>
          <input
            name="color"
            placeholder="e.g. Midnight Black"
            value={form.color}
            onChange={handleChange}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/50 text-sm"
          />
        </div>

        {/* Year */}
        <div className="space-y-2">
          <label className="text-white/60 text-sm font-medium ml-1">{t("requestDetails.fields.year")}</label>
          <input
            type="number"
            name="year"
            placeholder="2024"
            value={form.year}
            onChange={handleChange}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/50 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
