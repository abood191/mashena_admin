import { useState } from "react";
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
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from "lucide-react";

function getInitialVehicleForm(request) {
  return {
    vehicleTypeId: request.vehicleTypeId || "",
    plateNumber: request.vehiclePlateNumber || "",
    model: request.vehicleModel || "",
    color: request.vehicleColor || "",
    year: request.vehicleYear || "",
    isPrimary: true,
  };
}

function StatusPill({ status, t }) {
  const s = status?.toLowerCase();
  const colors =
    s === "submitted"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
      : s === "under_review"
      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
      : s === "approved"
      ? "bg-green-500/10 text-green-500 border-green-500/20"
      : s === "rejected"
      ? "bg-red-500/10 text-red-500 border-red-500/20"
      : s === "blocked"
      ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
      : "bg-foreground/5 text-foreground/60 border-border-subtle";

  return (
    <span className={`px-3 py-1 rounded-xl border text-xs font-bold uppercase tracking-wider ${colors}`}>
      {t(`requestDetails.statuses.${s}`, status)}
    </span>
  );
}

function RequestDetailsContent({ request, vehicleTypes, navigate, t }) {
  const [form, setForm] = useState(() => getInitialVehicleForm(request));
  const [docsMap, setDocsMap] = useState({});
  const [rejectOpen, setRejectOpen] = useState(false);

  const approveMutation = useApproveDriverRequest();
  const rejectMutation = useRejectDriverRequest();
  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  const isProcessed = ["approved", "rejected", "blocked"].includes(request.status?.toLowerCase());

  const validationError = (() => {
    if (isProcessed) return null;
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
  })();

  const handleApprove = async () => {
    if (validationError || isProcessed) return;

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
    try {
      await rejectMutation.mutateAsync({ id: request.id, rejectionReason: reason });
      toast.success(t("requestDetails.rejected", { defaultValue: "Request rejected." }));
      setRejectOpen(false);
      navigate("/requests");
    } catch (e) {
      toast.error(e?.message || t("requestDetails.updateFailed"));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/requests")}
            className="p-3 rounded-2xl bg-foreground/5 border border-border-subtle text-foreground hover:bg-foreground/10 transition-all shadow-sm"
          >
            <ChevronLeft size={20} className="rtl:rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("requestDetails.title")}</h1>
              <StatusPill status={request.status} t={t} />
            </div>
            <p className="text-foreground/50 text-sm mt-0.5 flex items-center gap-2">
              {t("requestDetails.refId")}: #{request.driverProfileId || request.id} •{" "}
              {t("requestDetails.registered")}: {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRejectOpen(true)}
            disabled={isMutating || isProcessed}
            className="px-5 py-3 rounded-2xl border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white font-semibold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            <XCircle size={18} />
            {t("requestDetails.reject")}
          </button>

          <button
            onClick={handleApprove}
            disabled={!!validationError || isMutating || isProcessed}
            className={`px-7 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all text-sm shadow-lg ${
              validationError || isProcessed
                ? "bg-foreground/5 border border-border-subtle text-foreground/40 cursor-not-allowed shadow-none"
                : "bg-[#4880FF] text-white hover:bg-[#3d6edb] shadow-[#4880FF]/25 active:scale-95"
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

      {/* Grid: Driver Info + Vehicle Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RequestInfo request={request} />
        <VehicleForm form={form} setForm={setForm} vehicleTypes={vehicleTypes} />
      </div>

      {/* Documents Uploader */}
      <DocumentsUploader
        driverProfileId={request.driverProfileId}
        onDocsChange={setDocsMap}
      />

      {/* Floating Validation Alert */}
      {validationError && !isProcessed && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/30 px-6 py-4 rounded-3xl backdrop-blur-md flex items-center gap-4 text-yellow-500 shadow-2xl animate-in zoom-in-95 fade-in duration-300 z-50">
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

      {/* Reject Modal */}
      <RejectReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleRejectConfirm}
        loading={rejectMutation.isPending}
      />
    </div>
  );
}

export default function DriverRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  const { data: request, isLoading: pageLoading, error: fetchError } = useDriverRequest(id);
  const { data: vehicleTypesData } = useVehicleTypes({ skip: 0, limit: 100 });
  const vehicleTypes = vehicleTypesData?.data || vehicleTypesData || [];

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-foreground">
        <Loader2 className="animate-spin mb-4 text-[#4880FF]" size={40} />
      </div>
    );
  }

  if (fetchError || !request) {
    return (
      <div className="p-8 flex flex-col items-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-10 flex flex-col items-center text-center max-w-md">
          <AlertTriangle className="text-red-500 mb-4" size={48} />
          <h1 className="text-foreground text-xl font-bold mb-2">Request Not Found</h1>
          <p className="text-foreground/70 mb-6">{fetchError?.message || t("common.nodata")}</p>
          <button
            onClick={() => navigate("/requests")}
            className="flex items-center gap-2 text-[#4880FF] hover:underline font-semibold"
          >
            <ChevronLeft size={16} className="rtl:rotate-180" /> {t("common.prev")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <RequestDetailsContent
      key={request.id}
      request={request}
      vehicleTypes={vehicleTypes}
      navigate={navigate}
      t={t}
    />
  );
}
