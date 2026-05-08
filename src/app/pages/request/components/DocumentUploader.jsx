import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { driverDocumentsService } from "@/app/services/driverDocuments.service";
import { CheckCircle2, AlertCircle, Loader2, Upload, Calendar } from "lucide-react";

export function DocumentsUploader({ driverProfileId, onDocsChange }) {
  const { t } = useTranslation("common");
  
  const docTypes = [
    { id: "license", label: t("requestDetails.docLabels.license"), required: true },
    { id: "insurance", label: t("requestDetails.docLabels.insurance"), required: true },
    { id: "mechanic", label: t("requestDetails.docLabels.mechanic"), required: true },
    { id: "identity", label: t("requestDetails.docLabels.identity"), required: true },
    { id: "other", label: t("requestDetails.docLabels.other"), required: false },
  ];

  const [docsStatus, setDocsStatus] = useState({});

  useEffect(() => {
    if (driverProfileId) {
      loadDocuments();
    }
  }, [driverProfileId]);

  const loadDocuments = async () => {
    try {
      const existingDocs = await driverDocumentsService.getAllByDriver(driverProfileId);
      const docsMap = {};
      const data = existingDocs.data || existingDocs;
      
      data.forEach(doc => {
        docsMap[doc.docType] = {
          id: doc.id,
          status: "success",
          fileUrl: doc.fileUrl,
          issuedAt: doc.issuedAt ? doc.issuedAt.split('T')[0] : "",
          expiresAt: doc.expiresAt ? doc.expiresAt.split('T')[0] : "",
          exists: true
        };
      });
      
      setDocsStatus(docsMap);
      if (onDocsChange) onDocsChange(docsMap);
    } catch (e) {
      console.error("Failed to load documents", e);
    }
  };

  const handleUpdateStatus = (type, data) => {
    setDocsStatus(prev => {
      const newItem = { ...prev[type], ...data };
      const newState = { ...prev, [type]: newItem };
      if (onDocsChange) onDocsChange(newState);
      return newState;
    });
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
            data={docsStatus[doc.id] || { status: "idle", issuedAt: "", expiresAt: "" }}
            onStatusChange={(data) => handleUpdateStatus(doc.id, data)}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

function DocumentItem({ type, label, required, driverProfileId, data, onStatusChange, t }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      onStatusChange({ status: "idle" });
      setErrorMsg("");
    }
  };

  const validateDates = () => {
    if (data.issuedAt && data.expiresAt) {
      if (new Date(data.expiresAt) <= new Date(data.issuedAt)) {
        setErrorMsg(t("requestDetails.validation.expiryError"));
        return false;
      }
    }
    return true;
  };

  const handleUpload = async () => {
    if (!file && !data.exists) {
      setErrorMsg("Please select a file first");
      return;
    }

    if (!validateDates()) return;

    onStatusChange({ status: "uploading" });
    setErrorMsg("");

    try {
      if (data.id) {
        await driverDocumentsService.update(data.id, {
          issuedAt: data.issuedAt,
          expiresAt: data.expiresAt,
          file: file || undefined
        });
      } else {
        await driverDocumentsService.upload({
          driverProfileId,
          docType: type,
          issuedAt: data.issuedAt,
          expiresAt: data.expiresAt,
          file: file
        });
      }
      
      onStatusChange({ status: "success", exists: true });
    } catch (e) {
      onStatusChange({ status: "error" });
      setErrorMsg(e.message || t("requestDetails.updateFailed"));
    }
  };

  const setDate = (field, val) => {
    onStatusChange({ [field]: val });
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
      data.status === 'success' ? 'border-green-500/20 bg-green-500/[0.02]' : 
      data.status === 'error' ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-white/10 bg-white/[0.02]'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{label}</span>
            {required && <span className="text-red-400 text-[10px] uppercase font-bold">{t("requestDetails.required")}</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {data.status === "success" && <><CheckCircle2 size={12} className="text-green-400" /><span className="text-green-400 text-[10px] font-bold uppercase">{t("requestDetails.verified")}</span></>}
            {data.status === "uploading" && <><Loader2 size={12} className="text-blue-400 animate-spin" /><span className="text-blue-400 text-[10px] font-bold uppercase">{t("requestDetails.uploading")}</span></>}
            {data.status === "error" && <><AlertCircle size={12} className="text-red-400" /><span className="text-red-400 text-[10px] font-bold uppercase">{t("requestDetails.updateFailed")}</span></>}
            {data.status === "idle" && !data.exists && <span className="text-white/20 text-[10px] font-bold uppercase tracking-tight">{t("requestDetails.needsUpload")}</span>}
            {data.status === "idle" && data.exists && <span className="text-white/40 text-[10px] font-bold uppercase tracking-tight">{t("requestDetails.modified")}</span>}
          </div>
        </div>

        {(file || (data.status === "idle" && data.exists)) && (
          <button
            onClick={handleUpload}
            disabled={data.status === "uploading"}
            className="p-2 hover:bg-white/5 rounded-full text-[#4880FF] hover:bg-[#4880FF]/10 transition-colors"
            title={t("requestDetails.saveChanges")}
          >
           <Upload size={18} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <label className="relative flex-1 cursor-pointer group">
            <input type="file" onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
            <div className="w-full h-24 rounded-xl border-2 border-dashed border-white/10 group-hover:border-white/20 transition-all flex flex-col items-center justify-center bg-white/[0.02]">
              {(preview || data.fileUrl) ? (
                <img 
                  src={preview || data.fileUrl} 
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
                value={data.issuedAt} 
                onChange={(e) => setDate("issuedAt", e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-2 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-[#4880FF]/50"
                placeholder={t("requestDetails.placeholderDate")}
              />
            </div>
            <div className="relative">
              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input 
                type="date" 
                value={data.expiresAt} 
                onChange={(e) => setDate("expiresAt", e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-2 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-[#4880FF]/50"
                placeholder={t("requestDetails.placeholderDate")}
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
