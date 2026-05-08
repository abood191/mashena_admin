import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { driverRequestsService } from "@/app/services/driverRequests.service";
import { vehicleTypesService } from "@/app/services/vehicleTypes.service";

// Internal Components
import { RequestInfo } from "./components/RequestInfo";
import { VehicleForm } from "./components/VehicleForm";


// Icons
import { CheckCircle2, XCircle, ChevronLeft, Loader2, AlertTriangle } from "lucide-react";
import { DocumentsUploader } from "./components/DocumentUploader";

export default function DriverRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  const [request, setRequest] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [docsMap, setDocsMap] = useState({});

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    vehicleTypeId: "",
    plateNumber: "",
    model: "",
    color: "",
    year: "",
    isPrimary: true,
  });

  const fetchData = async () => {
    try {
      setPageLoading(true);
      const res = await driverRequestsService.getById(id);
      const req = res.data || res;

      setRequest(req);
      setForm({
        vehicleTypeId: req.vehicleTypeId || "",
        plateNumber: req.vehiclePlateNumber || "",
        model: req.vehicleModel || "",
        color: req.vehicleColor || "",
        year: req.vehicleYear || "",
        isPrimary: true,
      });

      const vt = await vehicleTypesService.getAll();
      setVehicleTypes(vt.data || vt);
    } catch (e) {
      setErrorMsg(t("common.nodata"));
      console.error(e);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Validation Logic
  const validationError = useMemo(() => {
    if (!form.vehicleTypeId) return t("requestDetails.validation.noVehicle");
    if (!form.plateNumber) return t("requestDetails.validation.noPlate");

    const requiredTypes = ["license", "insurance", "mechanic", "identity"];
    for (const type of requiredTypes) {
      if (!docsMap[type] || docsMap[type].status !== "success") {
        return t("requestDetails.validation.missingDoc", { type: t(`requestDetails.docLabels.${type}`) });
      }
    }
    return null;
  }, [form, docsMap, t]);

  const handleApprove = async () => {
    if (validationError) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        ...form,
        vehicleTypeId: Number(form.vehicleTypeId),
        year: form.year ? Number(form.year) : undefined,
        driverProfileId: request.driverProfileId,
        photoUrl: request.vehiclePhotoUrl,
      };

      await driverRequestsService.approve(request.id, payload);
      navigate("/requests");
    } catch (e) {
      setErrorMsg(e.message || t("requestDetails.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt(t("requestDetails.rejectionReason"));
    if (!reason || reason.trim() === "") return;

    setLoading(true);
    try {
      await driverRequestsService.reject(request.id, {
        rejectionReason: reason,
      });
      navigate("/requests");
    } catch (e) {
      setErrorMsg(e.message || t("requestDetails.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <Loader2 className="animate-spin mb-4 text-[#4880FF]" size={40} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 flex flex-col items-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-10 flex flex-col items-center text-center max-w-md">
          <AlertTriangle className="text-red-500 mb-4" size={48} />
          <h1 className="text-white text-xl font-bold mb-2">Request Not Found</h1>
          <p className="text-white/60 mb-6">{errorMsg}</p>
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

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
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
              {t("requestDetails.refId")}: #{request.id} • {t("requestDetails.registered")} {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleReject}
            disabled={loading}
            className="px-6 py-3 rounded-2xl border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white font-semibold transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            <XCircle size={18} /> {t("requestDetails.reject")}
          </button>
          <button 
            onClick={handleApprove}
            disabled={!!validationError || loading}
            className={`px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#4880FF]/25 text-sm ${
              validationError 
                ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed' 
                : 'bg-[#4880FF] text-white hover:bg-[#3d6edb] active:scale-95'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {t("requestDetails.approve")}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm animate-in fade-in slide-in-from-top-1">
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RequestInfo request={request} />
        <VehicleForm 
          form={form} 
          setForm={setForm} 
          vehicleTypes={vehicleTypes} 
        />
      </div>

      <DocumentsUploader 
        driverProfileId={request.driverProfileId} 
        onDocsChange={setDocsMap}
      />

      {validationError && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/20 px-6 py-4 rounded-3xl backdrop-blur-md flex items-center gap-4 text-yellow-500 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-0.5">{t("requestDetails.validation.blocked")}</div>
            <div className="text-sm font-medium">{validationError}</div>
          </div>
        </div>
      )}
    </div>
  );
}
