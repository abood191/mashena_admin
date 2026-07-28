import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function UnauthorizedPage() {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
      <div className="bg-red-500/10 p-6 rounded-full mb-6 text-red-500">
        <ShieldAlert size={80} strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-bold text-foreground mb-4">
        403 Unauthorized
      </h1>
      <p className="text-muted text-lg max-w-md mb-8">
        You don't have permission to access this page. If you believe this is a mistake, please contact your system administrator.
      </p>
      <Link 
        to="/" 
        className="flex items-center gap-2 px-6 py-3 bg-[#4880FF] hover:bg-[#3d6edb] text-white font-semibold rounded-xl shadow-lg transition-all"
      >
        <ArrowLeft size={18} />
        Return to Dashboard
      </Link>
    </div>
  );
}
