import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit3, Trash2, CheckCircle2, XCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { 
  useVehicleTypes, 
  useCreateVehicleType, 
  useUpdateVehicleType, 
  useDeleteVehicleType 
} from "@/app/hooks/api/useVehicleTypes";
import { toast } from "sonner";
import { useConfirm } from "@/app/hooks/useConfirm";

export default function VehicleTypesPage() {
  const { t } = useTranslation("common");
  const [editingId, setEditingId] = useState(null);
  const { confirm, closeConfirm, ConfirmComponent } = useConfirm();

  const [form, setForm] = useState({
    name: "",
    description: "",
    multiplier: 1,
    isActive: true,
    image: null,
  });

  // ---------------- Hooks ----------------
  const { data: typesResponse, isLoading: isFetchingTypes } = useVehicleTypes();
  const types = typesResponse?.data || [];

  const createMutation = useCreateVehicleType();
  const updateMutation = useUpdateVehicleType();
  const deleteMutation = useDeleteVehicleType();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ---------------- Handlers ----------------

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      multiplier: 1,
      isActive: true,
      image: null,
    });
    setEditingId(null);
  };

  const handleCreateOrUpdate = async () => {
    if (!form.name) {
      toast.warning(t("roles.modal.nameRequired"));
      return;
    }

    if (!editingId && !form.image) {
      toast.warning("Image required");
      return;
    }

    try {
      if (editingId) {
        if (form.image) {
          const fd = new FormData();
          fd.append("_method", "PATCH"); 
          fd.append("name", form.name);
          fd.append("description", form.description || "");
          fd.append("multiplier", String(form.multiplier));
          fd.append("isActive", form.isActive ?  true: false);
          fd.append("image", form.image);

          await updateMutation.mutateAsync({ id: editingId, data: fd, isFormData: true });
        } else {
          await updateMutation.mutateAsync({ 
            id: editingId, 
            data: {
              name: form.name,
              description: form.description,
              multiplier: form.multiplier,
              isActive: form.isActive,
            },
            isFormData: false 
          });
        }
      } else {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("description", form.description);
        fd.append("multiplier", form.multiplier);
        fd.append("isActive", form.isActive);
        fd.append("image", form.image);

        await createMutation.mutateAsync(fd);
      }

      resetForm();
      toast.success(editingId ? "Vehicle type updated successfully" : "Vehicle type created successfully");
    } catch (e) {
      toast.error(e.message || "An error occurred");
    }
  };

  const handleEdit = (type) => {
    setEditingId(type.id);
    setForm({
      name: type.name,
      description: type.description || "",
      multiplier: Number(type.multiplier),
      isActive: type.isActive,
      image: null,
    });
  };

  const handleDelete = async (id) => {
    const typeToDelete = types.find(t => t.id === id);
    const typeName = typeToDelete?.name || "";

    const isConfirmed = await confirm({
      title: t("roles.confirm.title", { defaultValue: "Are you sure?" }),
      message: t("roles.confirm.message", { name: typeName }),
      dangerLabel: "Delete"
    });
    
    if (!isConfirmed) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Vehicle type deleted successfully");
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to delete");
    } finally {
      closeConfirm();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">{t("vehicleTypes.title")}</h1>
          <p className="text-white/40 text-sm mt-1">Manage transport classifications and pricing multipliers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* ================= LEFT LIST ================= */}
        <div className="space-y-4">
          <div className="bg-[#0b1220] rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
                {t("sidebar.vehicleTypes")} ({types.length})
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {isFetchingTypes ? (
                <div className="p-12 flex justify-center text-white/40"><Loader2 className="animate-spin" size={24} /></div>
              ) : types.length === 0 ? (
                <div className="p-12 text-center text-white/20 italic">{t("common.nodata")}</div>
              ) : (
                types.map((type) => (
                  <div key={type.id} className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={type.imageUrl}
                          className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg"
                          alt={type.name}
                        />
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0b1220] ${type.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-white font-bold">{type.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded-md border border-white/10 font-mono">
                            x{Number(type.multiplier).toFixed(2)}
                          </span>
                          <span className="text-white/20 text-xs truncate max-w-[200px]">{type.description}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(type)}
                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-[#4880FF] hover:border-[#4880FF]/30 transition-all"
                        title={t("roles.edit")}
                      >
                        <Edit3 size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(type.id)}
                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-red-500 hover:border-red-500/30 transition-all"
                        title={t("roles.delete")}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM ================= */}
        <div className="relative">
          <div className="sticky top-8 bg-[#0b1220] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-white/10 bg-[#4880FF]/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#4880FF]/10 text-[#4880FF]">
                {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
              </div>
              <h2 className="text-white font-bold">
                {editingId ? t("roles.modal.editTitle") : t("vehicleTypes.addType")}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase ml-1">{t("vehicleTypes.table.name")}</label>
                <input
                  placeholder={t("roles.modal.namePlaceholder")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase ml-1">{t("vehicleTypes.table.description")}</label>
                <textarea
                  placeholder="..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all min-h-[80px]"
                />
              </div>

              {/* Multiplier & Active */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white/40 text-xs font-bold uppercase ml-1">{t("vehicleTypes.table.multiplier")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.multiplier}
                    onChange={(e) => setForm({ ...form, multiplier: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/40 text-xs font-bold uppercase ml-1">{t("vehicleTypes.table.status")}</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`w-full h-[54px] rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                      form.isActive 
                      ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                      : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    {form.isActive ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {form.isActive ? "Active" : "Disabled"}
                  </button>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-white/40 text-xs font-bold uppercase ml-1">Icon / Image</label>
                <label className="relative flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <input
                    type="file"
                    onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                    className="hidden"
                    accept="image/*"
                  />
                  {form.image ? (
                    <img
                      src={URL.createObjectURL(form.image)}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="text-white/20 group-hover:text-[#4880FF] transition-colors" size={24} />
                      <span className="text-white/20 text-xs font-medium">{t("requestDetails.clickToUpload")}</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="flex-1 px-6 py-4 rounded-2xl border border-white/10 text-white/60 font-bold hover:bg-white/5 transition-all"
                  >
                    {t("common.cancel")}
                  </button>
                )}
                <button
                  onClick={handleCreateOrUpdate}
                  disabled={isSaving}
                  className="flex-[2] px-6 py-4 rounded-2xl bg-[#4880FF] text-white font-bold hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  {editingId ? t("common.save") : t("vehicleTypes.addType")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {ConfirmComponent}
    </div>
  );
}
