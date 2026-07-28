import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import UsersTable from "@/components/users/UsersTable";
import { useAdmins } from "@/app/hooks/api/useUsers";
import { useDebounce } from "@/hooks/useDebounce";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import { Search, ShieldAlert, Loader2, Plus } from "lucide-react";
import CreateEmployeeModal from "./components/CreateEmployeeModal";
import PermissionGuard from "../../auth/rbac/PermissionGuard";

export default function AdminsPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isFetching, error } = useAdmins({
    skip,
    limit,
    search: debouncedSearch,
  });

  const admins = data?.data || [];
  const count = data?.count || 0;

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load admins");
    }
  }, [error]);

  const columns = [
    { header: t("admins.table.name"), accessorKey: "fullName" },
    { header: t("admins.table.email"), accessorKey: "email" },
    { header: t("admins.table.phone"), accessorKey: "phoneNumber" },
    { 
      header: t("admins.table.createdAt"), 
      accessorKey: "createdAt",
      cell: ({ row }) => <span className="font-mono text-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
    },
    { 
      header: t("admins.table.status"), 
      cell: () => (
        <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-lg border border-green-500/20 text-[10px] font-bold uppercase tracking-wider">
          Active
        </span>
      )
    },
  ];

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("admins.title")}</h1>
            <p className="text-foreground text-sm mt-0.5">System administrators and management access</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground" size={18} />
          <input
            placeholder={t("admins.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSkip(0);
              
            }}
            className="w-full bg-surface border border-border-subtle rounded-2xl py-3.5 pl-12 pr-4 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
          />
          </div>
          
          <PermissionGuard requiredAny={["create_admin", "manage_users"]}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3.5 bg-[#4880FF] hover:bg-[#3d6edb] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#4880FF]/25 whitespace-nowrap"
            >
              <Plus size={18} />
              {t("admins.create", "Create Admin")}
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
        <UsersTable 
          columns={columns} 
          data={admins} 
          loading={isFetching} 
          onRowClick={(user) => navigate(`/profile/admins/${user.id}`)}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-foreground text-xs font-medium bg-foreground/5 px-4 py-2 rounded-full border border-border-subtle">
          {t("admins.pageInfo", { 
            current: currentPage, 
            total: totalPages, 
            count 
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSkip(Math.max(skip - limit, 0))}
            disabled={skip === 0}
            className="px-6 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.prev")}
          </button>
          <button
            onClick={() => setSkip(skip + limit < count ? skip + limit : skip)}
            disabled={skip + limit >= count}
            className="px-6 py-2.5 rounded-xl bg-[#4880FF] text-white! font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("common.next")}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <CreateEmployeeModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
