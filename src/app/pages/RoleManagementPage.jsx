import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "../hooks/api/useRoles";
import { RoleModal } from "./roles/components/RoleModal";
import { RolePermissionsPanel } from "./roles/components/RolePermissionsPanel";
import { toast } from "sonner";
import { useConfirm } from "../hooks/useConfirm";
import { useDebounce } from "@/hooks/useDebounce";

const ACTIVE = "#4880FF";

export default function RoleManagementPage() {
  const { t } = useTranslation("common");

  // Pagination & Search
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Selection
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // Queries
  const { data: rolesData, isFetching: loadingRoles, error: rolesError } = useRoles({ skip, limit, search: debouncedSearch });
  const roles = rolesData?.data || [];
  const rolesCount = rolesData?.count || 0;

  // Error handling
  useEffect(() => {
    if (rolesError) toast.error(rolesError.message || "Failed to load roles");
  }, [rolesError]);

  // Select first role automatically
  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  // UI State
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);

  const { confirm, closeConfirm, ConfirmComponent } = useConfirm();

  // Mutations
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const handleCreateRole = async (name) => {
    try {
      await createMutation.mutateAsync({ name });
      setCreateOpen(false);
      toast.success(t("roles.toast.roleCreated", { defaultValue: "Role created successfully" }));
      setSkip(0);
    } catch (e) {
      toast.error(e?.message || "Create role failed");
    }
  };

  const handleEditRole = async (name) => {
    if (!editRole) return;
    try {
      await updateMutation.mutateAsync({ id: editRole.id, name });
      setEditOpen(false);
      setEditRole(null);
      toast.success(t("roles.toast.roleUpdated", { defaultValue: "Role updated successfully" }));
    } catch (e) {
      toast.error(e?.message || "Update role failed");
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.name === "ADMIN") {
      toast.error(t("roles.toast.cannotDeleteAdmin", { defaultValue: "Cannot delete the ADMIN role" }));
      return;
    }

    const isConfirmed = await confirm({
      title: t("roles.confirm.title", { defaultValue: "Are you sure?" }),
      message: t("roles.confirm.message", { name: role.name }),
      dangerLabel: t("roles.confirm.delete", { defaultValue: "Delete" }),
    });

    if (!isConfirmed) return;

    try {
      await deleteMutation.mutateAsync(role.id);
      toast.success(t("roles.toast.roleDeleted", { defaultValue: "Role deleted successfully" }));
      if (roles.length === 1 && skip > 0) {
        setSkip((s) => Math.max(0, s - limit));
      }
      if (selectedRoleId === role.id) setSelectedRoleId(null);
    } catch (e) {
      toast.error(e?.message || "Delete role failed");
    } finally {
      closeConfirm();
    }
  };

  // Pagination helpers
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(rolesCount / limit));
  const canPrev = skip > 0;
  const canNext = skip + limit < rolesCount;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-white text-xl font-semibold">{t("roles.title", { defaultValue: "Roles & Permissions" })}</div>
          <div className="mt-1 text-white/50 text-sm">{t("roles.subtitle", { defaultValue: "Manage system access and privileges" })}</div>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-2xl bg-[#4880FF] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-[#4880FF]/25"
        >
          + {t("roles.addRole", { defaultValue: "Add Role" })}
        </button>
      </div>

      {/* Layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Left: Roles list */}
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] overflow-hidden flex flex-col min-h-[500px] shadow-2xl">
          <div className="p-4 border-b border-white/10 space-y-3 bg-white/[0.01]">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSkip(0);
              }}
              placeholder={t("roles.searchRole", { defaultValue: "Search roles..." })}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#4880FF]/70 focus:ring-4 focus:ring-[#4880FF]/10 transition-all shadow-inner shadow-black/20"
            />

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="text-xs font-semibold tracking-wider text-white/40 uppercase">
                {rolesCount === 0
                  ? "0"
                  : `Page ${currentPage} / ${totalPages} — ${rolesCount} total`}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSkip((s) => Math.max(0, s - limit))}
                  disabled={!canPrev || loadingRoles}
                  className="h-8 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-white/80 disabled:opacity-30 transition-all active:scale-95"
                >
                  Prev
                </button>
                <button
                  onClick={() => setSkip((s) => s + limit)}
                  disabled={!canNext || loadingRoles}
                  className="h-8 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-white/80 disabled:opacity-30 transition-all active:scale-95"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Roles List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/10 relative">
             {loadingRoles && (
               <div className="absolute inset-0 bg-[#0b1220]/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-[#4880FF] animate-spin"></div>
               </div>
             )}
             
              {roles.map((role) => {
                const active = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={["w-full text-left px-4 py-4 flex items-center gap-4 transition-all duration-200 group", active ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"].join(" ")}
                  >
                    <div
                      className={`h-12 w-12 shrink-0 rounded-2xl border grid place-items-center text-xs transition-colors duration-300 ${active ? 'bg-[#4880FF]/10 border-[#4880FF]/30' : 'bg-white/[0.03] border-white/10'}`}
                      style={{ color: active ? ACTIVE : 'rgba(255,255,255,0.4)' }}
                    >
                      <div className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-[#4880FF] shadow-[0_0_10px_#4880FF]' : 'bg-white/20'}`} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-white font-bold tracking-wide truncate">{role.name}</div>
                    </div>

                    <div className={`flex items-center gap-2 shrink-0 transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditRole(role);
                          setEditOpen(true);
                        }}
                        className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-[#4880FF]/10 hover:border-[#4880FF]/30 hover:text-[#4880FF] text-white/50 grid place-items-center text-sm transition-all"
                        title={t("roles.edit", { defaultValue: "Edit" })}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role);
                        }}
                        className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-white/50 grid place-items-center text-sm transition-all"
                        title={t("roles.delete", { defaultValue: "Delete" })}
                      >
                        🗑
                      </button>
                    </div>
                  </button>
                );
              })}

              {!roles.length && !loadingRoles ? (
                <div className="p-12 text-sm text-white/30 italic text-center font-medium">No roles found</div>
              ) : null}
          </div>
        </div>

        {/* Right: Side panel for Permissions */}
        <RolePermissionsPanel selectedRole={selectedRole} />
      </div>

      {/* Modals */}
      <RoleModal
        open={createOpen}
        mode="create"
        initialName=""
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateRole}
        loading={createMutation.isPending}
      />

      <RoleModal
        open={editOpen}
        mode="edit"
        initialName={editRole?.name || ""}
        onClose={() => {
          setEditOpen(false);
          setEditRole(null);
        }}
        onSubmit={handleEditRole}
        loading={updateMutation.isPending}
      />

      {ConfirmComponent}
    </div>
  );
}
