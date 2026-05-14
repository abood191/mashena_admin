import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDriverDocuments, useUploadDriverDocument, useUpdateDriverDocument } from "@/app/hooks/api/useDriverDocuments";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2, Upload, Calendar } from "lucide-react";

/**
 * DocumentsUploader — orchestrates all doc slots for a single driver.
 * Now fully query-driven: loads existing documents via React Query.
 * Propagates a docsMap up to the parent for validation.
 */
export function DocumentsUploader({ driverProfileId, onDocsChange }) {
  const { t } = useTranslation("common");

  const docTypes = [
    { id: "license",   label: t("requestDetails.docLabels.license"),   required: true },
    { id: "insurance", label: t("requestDetails.docLabels.insurance"), required: true },
    { id: "mechanic",  label: t("requestDetails.docLabels.mechanic"),  required: true },
    { id: "identity",  label: t("requestDetails.docLabels.identity"),  required: true },
    { id: "other",     label: t("requestDetails.docLabels.other"),     required: false },
  ];

  const { data: existingDocs = [], isLoading } = useDriverDocuments(driverProfileId);

  // Build a docsMap from the server data and propagate it to parent for validation
  useEffect(() => {
    if (!existingDocs.length) return;
    const docsMap = {};
    existingDocs.forEach((doc) => {
      docsMap[doc.docType] = {
        id: doc.id,
        status: "success",
        fileUrl: doc.fileUrl,
        issuedAt: doc.issuedAt ? doc.issuedAt.split("T")[0] : "",
        expiresAt: doc.expiresAt ? doc.expiresAt.split("T")[0] : "",
        exists: true,
      };
    });
    if (onDocsChange) onDocsChange(docsMap);
  }, [existingDocs]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-8 flex justify-center items-center min-h-[200px]">
        <Loader2 className="animate-spin text-[#4880FF]" size={32} />
      </div>
    );
  }

  // Build initial data per slot from query results
  const getInitialData = (docType) => {
    const doc = existingDocs.find((d) => d.docType === docType);
    if (!doc) return { status: "idle", issuedAt: "", expiresAt: "", exists: false };
    return {
      id: doc.id,
      status: "success",
      fileUrl: doc.fileUrl,
      issuedAt: doc.issuedAt ? doc.issuedAt.split("T")[0] : "",
      expiresAt: doc.expiresAt ? doc.expiresAt.split("T")[0] : "",
      exists: true,
    };
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-xl space-y-6">
      <div>
        <h2 className="text-white text-lg font-semibold">{t("requestDetails.requiredDocs")}</h2>
        <p className="text-white/40 text-sm">{t("requestDetails.requiredDocsSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docTypes.map((doc) => (
          <DocumentItem
            key={doc.id}
            type={doc.id}
            label={doc.label}
            required={doc.required}
            driverProfileId={driverProfileId}
            initialData={getInitialData(doc.id)}
            onUploadSuccess={() => {
              // onDocsChange will be re-called via the useEffect above after invalidation triggers a refetch
            }}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * DocumentItem — handles a single document slot.
 * - Uses React Query mutations for upload/update
 * - Cleans up object URLs on unmount (no memory leaks)
 * - Prevents duplicate submissions via isPending state
 */
function DocumentItem({ type, label, required, driverProfileId, initialData, t }) {
  const [localData, setLocalData] = useState(initialData);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const previewUrlRef = useRef(null);

  // Sync if parent re-renders with fresh server data
  useEffect(() => {
    setLocalData(initialData);
    setFile(null);
    setPreview(null);
  }, [initialData.id, initialData.status]);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const uploadMutation = useUploadDriverDocument();
  const updateMutation = useUpdateDriverDocument();
  const isBusy = uploadMutation.isPending || updateMutation.isPending;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Revoke previous object URL before creating a new one
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const url = URL.createObjectURL(selectedFile);
    previewUrlRef.current = url;

    setFile(selectedFile);
    setPreview(url);
    setLocalData((prev) => ({ ...prev, status: "idle" }));
    setErrorMsg("");
  };

  const validateDates = () => {
    if (localData.issuedAt && localData.expiresAt) {
      if (new Date(localData.expiresAt) <= new Date(localData.issuedAt)) {
        setErrorMsg(t("requestDetails.validation.expiryError"));
        return false;
      }
    }
    return true;
  };

  const handleUpload = async () => {
    // Guard: don't allow submission if already uploading
    if (isBusy) return;

    if (!file && !localData.exists) {
      setErrorMsg("Please select a file first.");
      return;
    }
    if (!validateDates()) return;

    setErrorMsg("");
    setLocalData((prev) => ({ ...prev, status: "uploading" }));

    try {
      if (localData.id) {
        // UPDATE existing document
        await updateMutation.mutateAsync({
          id: localData.id,
          driverProfileId, // needed for cache invalidation key
          issuedAt: localData.issuedAt,
          expiresAt: localData.expiresAt,
          file: file || undefined,
        });
      } else {
        // UPLOAD new document
        await uploadMutation.mutateAsync({
          driverProfileId,
          docType: type,
          issuedAt: localData.issuedAt,
          expiresAt: localData.expiresAt,
          file,
        });
      }

      setLocalData((prev) => ({ ...prev, status: "success", exists: true }));
      setFile(null);
      // Clean up preview URL after successful upload
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreview(null);
      toast.success(`${label} saved successfully`);
    } catch (e) {
      setLocalData((prev) => ({ ...prev, status: "error" }));
      const msg = e?.message || t("requestDetails.updateFailed");
      setErrorMsg(msg);
      toast.error(`${label}: ${msg}`);
    }
  };

  const setDate = (field, val) => {
    setLocalData((prev) => ({ ...prev, [field]: val }));
  };

  const showUploadButton = file || (localData.status === "idle" && localData.exists);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 ${
        localData.status === "success"
          ? "border-green-500/20 bg-green-500/[0.02]"
          : localData.status === "error"
            ? "border-red-500/20 bg-red-500/[0.02]"
            : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{label}</span>
            {required && (
              <span className="text-red-400 text-[10px] uppercase font-bold">
                {t("requestDetails.required")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {localData.status === "success" && (
              <><CheckCircle2 size={12} className="text-green-400" /><span className="text-green-400 text-[10px] font-bold uppercase">{t("requestDetails.verified")}</span></>
            )}
            {localData.status === "uploading" && (
              <><Loader2 size={12} className="text-blue-400 animate-spin" /><span className="text-blue-400 text-[10px] font-bold uppercase">{t("requestDetails.uploading")}</span></>
            )}
            {localData.status === "error" && (
              <><AlertCircle size={12} className="text-red-400" /><span className="text-red-400 text-[10px] font-bold uppercase">{t("requestDetails.updateFailed")}</span></>
            )}
            {localData.status === "idle" && !localData.exists && (
              <span className="text-white/20 text-[10px] font-bold uppercase tracking-tight">{t("requestDetails.needsUpload")}</span>
            )}
            {localData.status === "idle" && localData.exists && (
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-tight">{t("requestDetails.modified")}</span>
            )}
          </div>
        </div>

        {showUploadButton && (
          <button
            onClick={handleUpload}
            disabled={isBusy}
            className="p-2 rounded-full text-[#4880FF] hover:bg-[#4880FF]/10 disabled:opacity-40 transition-colors"
            title={t("requestDetails.saveChanges")}
          >
            {isBusy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <label className="relative flex-1 cursor-pointer group">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
              disabled={isBusy}
            />
            <div className="w-full h-24 rounded-xl border-2 border-dashed border-white/10 group-hover:border-white/20 transition-all flex flex-col items-center justify-center bg-white/[0.02] overflow-hidden">
              {preview || localData.fileUrl ? (
                <img
                  src={preview || localData.fileUrl}
                  className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                  alt="Doc Preview"
                />
              ) : (
                <>
                  <Upload size={16} className="text-white/20 mb-1" />
                  <span className="text-white/20 text-[10px] font-medium">{t("requestDetails.clickToUpload")}</span>
                </>
              )}
              {file && <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none ring-2 ring-blue-500/50" />}
            </div>
          </label>

          <div className="flex-[1.5] space-y-2">
            <div className="relative">
              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="date"
                value={localData.issuedAt}
                onChange={(e) => setDate("issuedAt", e.target.value)}
                disabled={isBusy}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-2 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-[#4880FF]/50 disabled:opacity-50"
              />
            </div>
            <div className="relative">
              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="date"
                value={localData.expiresAt}
                onChange={(e) => setDate("expiresAt", e.target.value)}
                disabled={isBusy}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-2 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-[#4880FF]/50 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 text-red-400 text-[10px] font-medium bg-red-400/5 p-2 rounded-lg border border-red-400/10">
            <AlertCircle size={10} />
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
