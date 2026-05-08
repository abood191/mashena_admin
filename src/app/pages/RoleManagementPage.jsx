import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { rolesService } from "../services/roles.service";
import { permissionsService } from "../services/permissions.service";
import { ModalShell } from "../../components/ui/ModalShell";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { InlineToast } from "../../components/ui/InlineToast";

const ACTIVE = "#4880FF";

/* ----------------------------- UI Components ----------------------------- */

function RoleModal({ open, mode, initialName = "", onClose, onSubmit, loading }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setErr("");
    }
  }, [open, initialName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");

    const cleaned = (name || "").trim().toUpperCase();
    if (!cleaned) {
      setErr(t("roles.modal.nameRequired"));
      return;
    }
    onSubmit(cleaned);
  };

  return (
    <ModalShell
      open={open}
      title={mode === "create" ? t("roles.modal.createTitle") : t("roles.modal.editTitle")}
      subtitle={mode === "create" ? t("roles.modal.createSubtitle") : t("roles.modal.editSubtitle")}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 px-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white/80 disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>

          <button
            type="submit"
            form="role-form"
            disabled={loading}
            className="h-10 px-4 rounded-2xl bg-[#4880FF] hover:brightness-110 text-sm text-white disabled:opacity-60"
          >
            {loading ? t("common.saving") : t("common.save")}
          </button>
        </>
      }
    >
      <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-white/70">{t("roles.modal.nameLabel")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("roles.modal.namePlaceholder")}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#4880FF]/70 focus:ring-4 focus:ring-[#4880FF]/10"
          />
          {err ? <div className="mt-2 text-xs text-red-200">{err}</div> : null}
        </div>

        <div className="text-xs text-white/45"> {t("roles.modal.hint")}</div>
      </form>
    </ModalShell>
  );
}

/* ----------------------------- Page Component ----------------------------- */

export default function RoleManagementPage() {
  const { t } = useTranslation();

  // Data
  const [roles, setRoles] = useState([]);
  const [rolesCount, setRolesCount] = useState(0);
  const [rolesSkip, setRolesSkip] = useState(0);
  const [rolesLimit] = useState(10);

  const [allPermissions, setAllPermissions] = useState([]);

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [assignedIds, setAssignedIds] = useState([]);

  // Loading flags
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [loadingRolePerms, setLoadingRolePerms] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingRolePerms, setSavingRolePerms] = useState(false);

  // UI state
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);

  const [toast, setToast] = useState({ show: false, tone: "info", message: "" });
  const showToast = (tone, message) => setToast({ show: true, tone, message });

  const closeToast = () => setToast((p) => ({ ...p, show: false }));

  // Fetch roles
  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await rolesService.list({ skip: rolesSkip, limit: rolesLimit });
      const data = res?.data || [];
      setRoles(data);
      setRolesCount(res?.count || 0);

      // select first role if none selected
      if (!selectedRoleId && data.length) {
        setSelectedRoleId(data[0].id);
      }

      // إذا الرول المحدد صار مو موجود بالصفحة الحالية (مثلاً بعد delete)
      if (selectedRoleId && data.length && !data.some((r) => r.id === selectedRoleId)) {
        setSelectedRoleId(data[0].id);
      }
    } catch (e) {
      showToast("error", e?.message || "Failed to load roles");
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch permissions list
  const fetchPermissions = async () => {
    setLoadingPerms(true);
    try {
      const res = await permissionsService.list({ skip: 0, limit: 1000 });
      setAllPermissions(res?.data || []);
    } catch (e) {
      showToast("error", e?.message || "Failed to load permissions");
    } finally {
      setLoadingPerms(false);
    }
  };

  // Init + on pagination change
  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesSkip, rolesLimit]);

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch selected role permissions
  useEffect(() => {
    const run = async () => {
      if (!selectedRoleId) return;
      setLoadingRolePerms(true);
      try {
        const res = await rolesService.getRolePermissions({ roleId: selectedRoleId });
        const ids = (res?.permissions || []).map((p) => p.id);
        setAssignedIds(ids);
      } catch (e) {
        showToast("error", e?.message || "Failed to load role permissions");
        setAssignedIds([]);
      } finally {
        setLoadingRolePerms(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoleId]);

  const filteredRoles = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(s));
  }, [roles, search]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const assigned = useMemo(
    () => allPermissions.filter((p) => assignedIds.includes(p.id)),
    [allPermissions, assignedIds]
  );

  const available = useMemo(
    () => allPermissions.filter((p) => !assignedIds.includes(p.id)),
    [allPermissions, assignedIds]
  );

  // Pagination helpers
  const currentPage = Math.floor(rolesSkip / rolesLimit) + 1;
  const totalPages = Math.max(1, Math.ceil(rolesCount / rolesLimit));
  const canPrev = rolesSkip > 0;
  const canNext = rolesSkip + rolesLimit < rolesCount;

  const goPrev = () => setRolesSkip((s) => Math.max(0, s - rolesLimit));
  const goNext = () => setRolesSkip((s) => s + rolesLimit);

  // CRUD Roles
  const handleCreateRole = async (name) => {
    setSavingRole(true);
    try {
      await rolesService.create({ name });
      setCreateOpen(false);
      showToast("success", t("roles.toast.roleCreated"));

      // بعد create رجع لأول صفحة لتظهر الرول الجديدة غالباً
      setRolesSkip(0);
      await fetchRoles();
    } catch (e) {
      showToast("error", e?.message || "Create role failed");
    } finally {
      setSavingRole(false);
    }
  };

  const openEdit = (role) => {
    setEditRole(role);
    setEditOpen(true);
  };

  const handleEditRole = async (name) => {
    if (!editRole) return;
    setSavingRole(true);
    try {
      await rolesService.update({ id: editRole.id, name });
      setEditOpen(false);
      setEditRole(null);
      showToast("success", t("roles.toast.roleUpdated"));
      await fetchRoles();
    } catch (e) {
      showToast("error", e?.message || "Update role failed");
    } finally {
      setSavingRole(false);
    }
  };

  const openDelete = (role) => {
    setDeleteRoleTarget(role);
    setConfirmOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleTarget) return;

    // (اختياري) منع حذف ADMIN
    if (deleteRoleTarget.name === "ADMIN") {
      showToast("error", t("roles.toast.cannotDeleteAdmin"));
      setConfirmOpen(false);
      setDeleteRoleTarget(null);
      return;
    }

    setSavingRole(true);
    try {
      await rolesService.remove({ id: deleteRoleTarget.id });
      showToast("success", t("roles.toast.roleDeleted"));
      setConfirmOpen(false);
      setDeleteRoleTarget(null);

      // إذا حذفنا آخر عنصر بالصفحة، نرجع صفحة لورا
      const willBeEmpty = roles.length === 1 && rolesSkip > 0;
      if (willBeEmpty) setRolesSkip((s) => Math.max(0, s - rolesLimit));

      await fetchRoles();
    } catch (e) {
      showToast("error", e?.message || "Delete role failed");
    } finally {
      setSavingRole(false);
    }
  };

  // Assign/Revoke (local)
  const assignPermission = (permId) => {
    setAssignedIds((prev) => (prev.includes(permId) ? prev : [...prev, permId]));
  };

  const revokePermission = (permId) => {
    setAssignedIds((prev) => prev.filter((x) => x !== permId));
  };

  // Save (PUT replace)
  const saveRolePermissions = async () => {
    if (!selectedRoleId) return;
    setSavingRolePerms(true);
    try {
      const res = await rolesService.setRolePermissions({
        roleId: selectedRoleId,
        permissionIds: assignedIds,
      });

      // السيرفر بيرجع permissions محدثة
      const ids = (res?.permissions || []).map((p) => p.id);
      setAssignedIds(ids);

      showToast("success", t("roles.toast.permissionsSaved"));
    } catch (e) {
      showToast("error", e?.message || "Save permissions failed");
    } finally {
      setSavingRolePerms(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-white text-xl font-semibold">{t("roles.title")}</div>
          <div className="mt-1 text-white/50 text-sm">{t("roles.subtitle")}</div>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-2xl bg-[#4880FF] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 active:scale-[0.99] transition"
        >
          + {t("roles.addRole")}
        </button>
      </div>

      {/* Toast */}
      <div className="mt-4">
        <InlineToast
          show={toast.show}
          tone={toast.tone}
          message={toast.message}
          onClose={closeToast}
        />
      </div>

      {/* Layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Left: Roles list */}
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] overflow-hidden">
          <div className="p-4 border-b border-white/10 space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("roles.searchRole")}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#4880FF]/70 focus:ring-4 focus:ring-[#4880FF]/10"
            />

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/45">
                {rolesCount === 0
                  ? "0"
                  : `Page ${currentPage} / ${totalPages} — ${rolesCount} total`}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={!canPrev || loadingRoles}
                  className="h-9 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs text-white/80 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={goNext}
                  disabled={!canNext || loadingRoles}
                  className="h-9 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs text-white/80 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Loading roles */}
          {loadingRoles ? (
            <div className="p-6 text-sm text-white/50">Loading roles...</div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredRoles.map((role) => {
                const active = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={[
                      "w-full text-left px-4 py-4 flex items-center gap-3 transition",
                      active ? "bg-white/[0.05]" : "hover:bg-white/[0.03]",
                    ].join(" ")}
                  >
                    <div
                      className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.03] grid place-items-center text-xs"
                      style={{ color: ACTIVE }}
                    >
                      ●
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-white font-medium truncate">{role.name}</div>
                      <div className="text-xs text-white/45">
                        {t("roles.permissionsCount", { count: assignedRoleCountHint(role.id, roles, selectedRoleId, assignedIds) })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(role);
                        }}
                        className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/70 grid place-items-center text-xs"
                        title={t("roles.edit")}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDelete(role);
                        }}
                        className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/70 grid place-items-center text-xs"
                        title={t("roles.delete")}
                      >
                        🗑
                      </button>
                    </div>
                  </button>
                );
              })}

              {!filteredRoles.length ? (
                <div className="p-6 text-sm text-white/50">No roles</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right: Side panel */}
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <div className="text-white font-semibold text-lg">
              {t("roles.manageFor")}{" "}
              <span style={{ color: ACTIVE }}>{selectedRole?.name || "-"}</span>
            </div>
            <div className="mt-1 text-white/50 text-sm">{t("roles.panelHint")}</div>
          </div>

          <div className="p-5 space-y-6">
            {/* Permissions loading info */}
            {(loadingPerms || loadingRolePerms) && (
              <div className="text-sm text-white/50">
                {loadingPerms ? "Loading permissions..." : "Loading role permissions..."}
              </div>
            )}

            {/* Assigned */}
            <div>
              <div className="text-sm text-white/70">{t("roles.assigned")}</div>

              <div className="mt-3 flex flex-wrap gap-2">
                {assigned.length === 0 ? (
                  <div className="text-sm text-white/40">{t("roles.noPermissions")}</div>
                ) : (
                  assigned.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80"
                    >
                      {p.name}
                      <button
                        onClick={() => revokePermission(p.id)}
                        disabled={savingRolePerms || loadingRolePerms}
                        className="h-6 w-6 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 grid place-items-center text-xs disabled:opacity-50"
                        title={t("roles.remove")}
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
              <div className="text-sm text-white/70">{t("roles.available")}</div>
              <div className="mt-3 space-y-2">
                {available.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => assignPermission(p.id)}
                    disabled={savingRolePerms || loadingRolePerms}
                    className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 text-sm text-white/80 disabled:opacity-50"
                  >
                    <span className="truncate">{p.name}</span>
                    <span
                      className="h-8 px-3 rounded-xl border border-white/10 bg-white/[0.03] grid place-items-center text-xs"
                      style={{ color: ACTIVE }}
                    >
                      + {t("roles.assign")}
                    </span>
                  </button>
                ))}

                {available.length === 0 && (
                  <div className="text-sm text-white/40">{t("roles.allAssigned")}</div>
                )}
              </div>
            </div>

            {/* Save */}
            <div className="pt-2">
              <button
                className="w-full rounded-2xl bg-[#4880FF] py-3 text-sm font-medium text-white hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60"
                onClick={saveRolePermissions}
                disabled={!selectedRoleId || savingRolePerms || loadingRolePerms}
              >
                {savingRolePerms ? "Saving..." : t("roles.saveChanges")}
              </button>
             
            </div>
          </div>
        </div>
      </div>

      {/* Create Role modal */}
      <RoleModal
        open={createOpen}
        mode="create"
        initialName=""
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateRole}
        loading={savingRole}
      />

      {/* Edit Role modal */}
      <RoleModal
        open={editOpen}
        mode="edit"
        initialName={editRole?.name || ""}
        onClose={() => {
          setEditOpen(false);
          setEditRole(null);
        }}
        onSubmit={handleEditRole}
        loading={savingRole}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title={t("roles.confirm.title")}
        message={t("roles.confirm.message", { name: deleteRoleTarget?.name || "" })}
        cancelLabel={t("common.cancel")}
        dangerLabel={t("roles.confirm.delete")}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteRoleTarget(null);
        }}
        onConfirm={handleDeleteRole}
        loading={savingRole}
      />
    </div>
  );
}

/**
 * NOTE:
 * بالـ API تبعك ما في "count permissions لكل role" ضمن list roles.
 * لهذا نحط hint بسيط:
 * - إذا role هو selected -> نعرض assignedIds.length (لأنه fetched)
 * - غير هيك -> نعرض 0 (أو خليها "-")
 */
function assignedRoleCountHint(roleId, roles, selectedRoleId, assignedIds) {
  if (roleId === selectedRoleId) return assignedIds.length;
  return "-";
}
