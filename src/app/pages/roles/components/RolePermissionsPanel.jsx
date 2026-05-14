import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions } from "../../../hooks/api/usePermissions";
import { useRolePermissions, useSetRolePermissions } from "../../../hooks/api/useRoles";
import { toast } from "sonner";

const ACTIVE = "#4880FF";

export function RolePermissionsPanel({ selectedRole }) {
  const { t } = useTranslation("common");
  
  const [assignedIds, setAssignedIds] = useState([]);
  
  // Queries
  const { data: allPermissionsData, isFetching: loadingPerms } = usePermissions();
  const allPermissions = allPermissionsData?.data || [];

  const { data: rolePermsData, isFetching: loadingRolePerms } = useRolePermissions(selectedRole?.id);

  // Sync assigned IDs when query changes
  useEffect(() => {
    if (rolePermsData?.permissions) {
      setAssignedIds(rolePermsData.permissions.map(p => p.id));
    } else {
      setAssignedIds([]);
    }
  }, [rolePermsData]);

  // Mutations
  const setPermsMutation = useSetRolePermissions();

  const assigned = useMemo(
    () => allPermissions.filter((p) => assignedIds.includes(p.id)),
    [allPermissions, assignedIds]
  );

  const available = useMemo(
    () => allPermissions.filter((p) => !assignedIds.includes(p.id)),
    [allPermissions, assignedIds]
  );

  const assignPermission = (permId) => {
    setAssignedIds((prev) => (prev.includes(permId) ? prev : [...prev, permId]));
  };

  const revokePermission = (permId) => {
    setAssignedIds((prev) => prev.filter((x) => x !== permId));
  };

  const handleSave = async () => {
    if (!selectedRole?.id) return;
    try {
      await setPermsMutation.mutateAsync({
        roleId: selectedRole.id,
        permissionIds: assignedIds,
      });
      toast.success(t("roles.toast.permissionsSaved", { defaultValue: "Permissions saved successfully" }));
    } catch (e) {
      toast.error(e?.message || "Save permissions failed");
    }
  };

  const isSaving = setPermsMutation.isPending;
  const isLoading = loadingPerms || loadingRolePerms;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1220] overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-5 border-b border-white/10 shrink-0">
        <div className="text-white font-semibold text-lg">
          {t("roles.manageFor", { defaultValue: "Manage Permissions For" })}{" "}
          <span style={{ color: ACTIVE }}>{selectedRole?.name || "-"}</span>
        </div>
        <div className="mt-1 text-white/50 text-sm">{t("roles.panelHint", { defaultValue: "Select permissions from the available list." })}</div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-[#0b1220]/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-sm text-white/50 flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-[#4880FF] animate-spin"></div>
              Loading permissions...
            </div>
          </div>
        )}

        {/* Assigned */}
        <div>
          <div className="text-sm text-white/70 font-semibold">{t("roles.assigned", { defaultValue: "Assigned Permissions" })}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {assigned.length === 0 ? (
              <div className="text-sm text-white/40 italic">{t("roles.noPermissions", { defaultValue: "No permissions assigned yet." })}</div>
            ) : (
              assigned.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-100"
                >
                  {p.name}
                  <button
                    onClick={() => revokePermission(p.id)}
                    disabled={isSaving || isLoading}
                    className="h-6 w-6 rounded-lg border border-green-500/20 bg-black/20 hover:bg-red-500/50 hover:text-white text-green-200 grid place-items-center text-xs disabled:opacity-50 transition-colors"
                    title={t("roles.remove", { defaultValue: "Remove" })}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Available */}
        <div>
          <div className="text-sm text-white/70 font-semibold">{t("roles.available", { defaultValue: "Available Permissions" })}</div>
          <div className="mt-3 space-y-2">
            {available.map((p) => (
              <button
                key={p.id}
                onClick={() => assignPermission(p.id)}
                disabled={isSaving || isLoading}
                className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 text-sm text-white/80 disabled:opacity-50 transition-colors"
              >
                <span className="truncate">{p.name}</span>
                <span
                  className="h-8 px-3 rounded-xl border border-white/10 bg-[#4880FF]/10 text-[#4880FF] grid place-items-center text-xs font-semibold"
                >
                  + {t("roles.assign", { defaultValue: "Assign" })}
                </span>
              </button>
            ))}

            {available.length === 0 && !isLoading && (
              <div className="text-sm text-white/40 italic px-2">{t("roles.allAssigned", { defaultValue: "All available permissions have been assigned." })}</div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-5 border-t border-white/10 bg-white/[0.01] shrink-0">
        <button
          className="w-full rounded-2xl bg-[#4880FF] py-3.5 text-sm font-bold text-white hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-[#4880FF]/25 disabled:opacity-60 flex items-center justify-center gap-2"
          onClick={handleSave}
          disabled={!selectedRole?.id || isSaving || isLoading}
        >
          {isSaving && <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>}
          {t("roles.saveChanges", { defaultValue: "Save Changes" })}
        </button>
      </div>
    </div>
  );
}
