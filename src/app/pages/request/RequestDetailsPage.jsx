import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Hooks
import { useDriverRequest, useApproveDriverRequest, useRejectDriverRequest } from "@/app/hooks/api/useDriverRequests";
import { useVehicleTypes } from "@/app/hooks/api/useVehicleTypes";

// Sub-components
import { RequestInfo } from "./components/RequestInfo";
import { VehicleForm } from "./components/VehicleForm";
import { DocumentsUploader } from "./components/DocumentUploader";
import { RejectReasonModal } from "./components/RejectReasonModal";

// Icons
import { CheckCircle2, XCircle, ChevronLeft, Loader2, AlertTriangle } from "lucide-react";

export default function DriverRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  // ── Server Data ──────────────────────────────────────────────────────────────
  const { data: request, isLoading: pageLoading, error: fetchError } = useDriverRequest(id);

  // Vehicle types: long staleTime since they rarely change
  const { data: vehicleTypesData } = useVehicleTypes({ skip: 0, limit: 100 });
  const vehicleTypes = vehicleTypesData?.data || vehicleTypesData || [];

  // ── Local UI State ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    vehicleTypeId: "",
    plateNumber: "",
    model: "",
    color: "",
    year: "",
    isPrimary: true,
  });

  // Sync form with fetched request data
  const [formSynced, setFormSynced] = useState(false);
  if (request && !formSynced) {
    setForm({
      vehicleTypeId: request.vehicleTypeId || "",
      plateNumber: request.vehiclePlateNumber || "",
      model: request.vehicleModel || "",
      color: request.vehicleColor || "",
      year: request.vehicleYear || "",
      isPrimary: true,
    });
    setFormSynced(true);
  }

  // Docs map from uploader, used for validation
  const [docsMap, setDocsMap] = useState({});
  const [rejectOpen, setRejectOpen] = useState(false);

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const approveMutation = useApproveDriverRequest();
  const rejectMutation = useRejectDriverRequest();

  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  // ── Validation ────────────────────────────────────────────────────────────────
  const validationError = useMemo(() => {
    if (!form.vehicleTypeId) return t("requestDetails.validation.noVehicle");
    if (!form.plateNumber) return t("requestDetails.validation.noPlate");

    const requiredTypes = ["license", "insurance", "mechanic", "identity"];
    for (const type of requiredTypes) {
      if (!docsMap[type] || docsMap[type].status !== "success") {
        return t("requestDetails.validation.missingDoc", {
          type: t(`requestDetails.docLabels.${type}`),
        });
      }
    }
    return null;
  }, [form, docsMap, t]);

  // ── Action Handlers ───────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (validationError || !request) return;

    const payload = {
      ...form,
      vehicleTypeId: Number(form.vehicleTypeId),
      year: form.year ? Number(form.year) : undefined,
      driverProfileId: request.driverProfileId,
      photoUrl: request.vehiclePhotoUrl,
    };

    try {
      await approveMutation.mutateAsync({ id: request.id, payload });
      toast.success(t("requestDetails.approved", { defaultValue: "Request approved successfully!" }));
      navigate("/requests");
    } catch (e) {
      toast.error(e?.message || t("requestDetails.updateFailed"));
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!request) return;
    try {
      await rejectMutation.mutateAsync({ id: request.id, rejectionReason: reason });
      toast.success(t("requestDetails.rejected", { defaultValue: "Request rejected." }));
      setRejectOpen(false);
      navigate("/requests");
    } catch (e) {
      toast.error(e?.message || t("requestDetails.updateFailed"));
    }
  };

  // ── Loading / Error States ────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <Loader2 className="animate-spin mb-4 text-[#4880FF]" size={40} />
      </div>
    );
  }

  if (fetchError || !request) {
    return (
      <div className="p-8 flex flex-col items-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-10 flex flex-col items-center text-center max-w-md">
          <AlertTriangle className="text-red-500 mb-4" size={48} />
          <h1 className="text-white text-xl font-bold mb-2">Request Not Found</h1>
          <p className="text-white/60 mb-6">{fetchError?.message || t("common.nodata")}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} /> {t("common.prev")}
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">{t("requestDetails.title")}</h1>
            <p className="text-white/40 text-sm flex items-center gap-2">
              {t("requestDetails.refId")}: #{request.id} •{" "}
              {t("requestDetails.registered")} {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRejectOpen(true)}
            disabled={isMutating}
            className="px-6 py-3 rounded-2xl border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white font-semibold transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            <XCircle size={18} /> {t("requestDetails.reject")}
          </button>
          <button
            onClick={handleApprove}
            disabled={!!validationError || isMutating}
            className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#4880FF]/25 text-sm ${
              validationError
                ? "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                : "bg-[#4880FF] text-white hover:bg-[#3d6edb] active:scale-95"
            }`}
          >
            {approveMutation.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {t("requestDetails.approve")}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RequestInfo request={request} />
        <VehicleForm form={form} setForm={setForm} vehicleTypes={vehicleTypes} />
      </div>

      {/* Documents */}
      <DocumentsUploader
        driverProfileId={request.driverProfileId}
        onDocsChange={setDocsMap}
      />

      {/* Floating Validation Toast */}
      {validationError && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/20 px-6 py-4 rounded-3xl backdrop-blur-md flex items-center gap-4 text-yellow-500 shadow-2xl animate-in zoom-in-95 fade-in duration-300 z-50">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-0.5">
              {t("requestDetails.validation.blocked")}
            </div>
            <div className="text-sm font-medium">{validationError}</div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal — replaces blocking prompt() */}
      <RejectReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleRejectConfirm}
        loading={rejectMutation.isPending}
      />
    </div>
  );
}
