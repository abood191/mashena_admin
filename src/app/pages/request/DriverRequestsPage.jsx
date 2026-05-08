import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import UsersTable from "@/components/users/UsersTable";
import { driverRequestsService } from "@/app/services/driverRequests.service";
import { useNavigate } from "react-router-dom";

export default function DriverRequestsPage() {
  const { t } = useTranslation("common");
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [count, setCount] = useState(0);

  const fetchRequests = async () => {
    try {
      const res = await driverRequestsService.getAll({ skip, limit });
      setRequests(res.data || []);
      setCount(res.count || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [skip]);

  // 🎯 Table columns
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: t("requestDetails.refId"),
      accessorKey: "driverProfileId",
    },
    {
      header: t("requestDetails.fields.plate"),
      accessorKey: "vehiclePlateNumber",
    },
    {
      header: t("requestDetails.fields.model"),
      accessorKey: "vehicleModel",
    },
    {
      header: t("requestDetails.fields.year"),
      accessorKey: "vehicleYear",
    },
    {
      header: t("requestDetails.fields.status"),
      cell: ({ row }) => {
        const status = row.original.status?.toLowerCase();
        const color =
          status === "submitted" || status === "pending"
            ? "text-yellow-400"
            : status === "approved"
              ? "text-green-400"
              : "text-red-400";

        return <span className={color}>{t(`drivers.statuses.${status}`) || status}</span>;
      },
    },
    {
      header: t("common.search"),
      cell: ({ row }) => (
        <button
          onClick={() => handleView(row.original)}
          className="bg-[#4880FF]/10 text-[#4880FF] hover:bg-[#4880FF] hover:text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
        >
          {t("roles.edit")}
        </button>
      ),
    },
  ];

  const handleView = (request) => {
    navigate(`/driver-requests/${request.id}`);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">{t("sidebar.requests")}</h1>
        <div className="text-white/40 text-sm">
          {t("drivers.pageInfo", { current: Math.floor(skip / limit) + 1, total: Math.ceil(count / limit), count })}
        </div>
      </div>

      <div className="bg-[#0b1220] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <UsersTable columns={columns} data={requests} />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button
          onClick={() => setSkip(Math.max(skip - limit, 0))}
          disabled={skip === 0}
          className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold"
        >
          {t("common.prev")}
        </button>

        <button
          onClick={() => setSkip(skip + limit < count ? skip + limit : skip)}
          disabled={skip + limit >= count}
          className="px-6 py-2 rounded-xl bg-[#4880FF] text-white hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}
