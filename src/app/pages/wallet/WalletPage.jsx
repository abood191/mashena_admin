import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search, Wallet, Loader2, AlertTriangle, Plus, Minus,
  ArrowRightLeft, ShieldCheck, User, Mail, Phone, Car,
  X, DollarSign, FileText, Clock, Eye, ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import {
  useWallets, useWallet, useWalletTransactions, useAddBalance,
  useWithdraw, useUpdateWalletStatus, useTransfer,
} from "@/app/hooks/api/useWallet";
import { useDrivers, useRiders } from "@/app/hooks/api/useUsers";
import { useDebounce } from "@/hooks/useDebounce";
import UsersTable from "@/components/users/UsersTable";

const STATUS_COLORS = {
  ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
  FROZEN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  CLOSED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const TX_TYPE_COLORS = {
  DEPOSIT: "text-green-500",
  WITHDRAWAL: "text-red-400",
  TRANSFER_IN: "text-emerald-400",
  TRANSFER_OUT: "text-orange-400",
};

/* ───────────────────── Modal Shell ───────────────────── */
function Modal({ open, onClose, title, icon: Icon, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border-subtle rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-[#4880FF]/10 text-[#4880FF]">
                <Icon size={18} />
              </div>
            )}
            <h3 className="text-foreground font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-5">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="text-foreground/40 text-xs font-bold uppercase ml-1">{children}</label>;
}

function Input({ type = "text", ...props }) {
  return (
    <input
      type={type}
      className="w-full rounded-2xl border border-border-subtle bg-foreground/5 px-4 py-3.5 text-foreground placeholder:text-foreground/10 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
      {...props}
    />
  );
}

function PrimaryBtn({ children, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-6 py-4 rounded-2xl bg-[#4880FF] text-white! font-bold hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {disabled && <Loader2 className="animate-spin" size={18} />}
      {children}
    </button>
  );
}

/* ───────────────────── Autocomplete Search ───────────────────── */
function UserAutocomplete({
  placeholder,
  value,
  onChange,
  filterType = "all",
  allowManualId = false,
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const displayValue = value ? (value.fullName || "") : search;

  const { data: driversData, isFetching: driversFetching } = useDrivers(
    { search: debouncedSearch, limit: 5, skip: 0 },
    { enabled: isOpen && debouncedSearch.length >= 2 && (filterType === "all" || filterType === "driver") }
  );

  const { data: ridersData, isFetching: ridersFetching } = useRiders(
    { search: debouncedSearch, limit: 5, skip: 0 },
    { enabled: isOpen && debouncedSearch.length >= 2 && filterType === "all" }
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const drivers = driversData?.data || [];
  const riders = ridersData?.data || [];
  const hasResults = drivers.length > 0 || riders.length > 0;
  const loading = driversFetching || ridersFetching;

  const handleClear = () => {
    setSearch("");
    onChange(null);
    setIsOpen(false);
  };

  const handleSelect = (user) => {
    onChange(user);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
        <input
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            if (value) {
              onChange(null);
            }
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-surface border border-border-subtle rounded-2xl py-3.5 pl-12 pr-10 text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all text-sm"
        />
        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1 rounded-full hover:bg-foreground/5 transition-all"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (debouncedSearch.length >= 2 || (allowManualId && search.trim())) && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          {loading && (
            <div className="flex items-center justify-center p-4 gap-2 text-foreground/60 text-xs">
              <Loader2 className="animate-spin text-[#4880FF]" size={14} />
              <span>Searching...</span>
            </div>
          )}

          {!loading && !hasResults && (
            <div className="p-4 text-center text-foreground/40 text-xs italic">
              No matching users found
            </div>
          )}

          {allowManualId && /^\d+$/.test(search.trim()) && (
            <div
              onClick={() => {
                onChange({ id: search.trim(), fullName: `User ID: ${search.trim()}` });
                setIsOpen(false);
              }}
              className="px-4 py-3 text-xs text-[#4880FF] hover:bg-foreground/5 cursor-pointer border-b border-border-subtle font-medium flex items-center gap-2"
            >
              <User size={14} />
              <span>Direct Lookup by ID: <strong>{search.trim()}</strong></span>
            </div>
          )}

          {drivers.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-foreground/5 text-xs font-bold text-[#4880FF] tracking-wider uppercase border-y border-border-subtle/50">
                Drivers
              </div>
              <div className="divide-y divide-border-subtle/40">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    onClick={() => handleSelect(driver)}
                    className="px-4 py-3 hover:bg-foreground/5 cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-foreground text-sm font-semibold truncate">{driver.fullName}</div>
                      <div className="text-foreground/40 text-xs truncate">{driver.email || driver.phoneNumber || "No contact info"}</div>
                    </div>
                    <span className="shrink-0 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                      Driver
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {riders.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-foreground/5 text-xs font-bold text-green-500 tracking-wider uppercase border-y border-border-subtle/50">
                Riders
              </div>
              <div className="divide-y divide-border-subtle/40">
                {riders.map((rider) => (
                  <div
                    key={rider.id}
                    onClick={() => handleSelect(rider)}
                    className="px-4 py-3 hover:bg-foreground/5 cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-foreground text-sm font-semibold truncate">{rider.fullName}</div>
                      <div className="text-foreground/40 text-xs truncate">{rider.email || rider.phoneNumber || "No contact info"}</div>
                    </div>
                    <span className="shrink-0 bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                      Rider
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────── Main Page ───────────────────── */
export default function WalletPage() {
  const [view, setView] = useState("list"); // "list" | "detail"

  // List Pagination State
  const [listSkip, setListSkip] = useState(0);
  const [listLimit] = useState(10);

  // Detail State
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Transaction Pagination State
  const [txSkip, setTxSkip] = useState(0);
  const [txLimit] = useState(10);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [addForm, setAddForm] = useState({ amount: "", description: "" });
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", description: "" });
  const [transferForm, setTransferForm] = useState({ fromDriverProfileId: "", toDriverProfileId: "", amount: "", description: "" });
  const [selectedFromDriver, setSelectedFromDriver] = useState(null);
  const [selectedToDriver, setSelectedToDriver] = useState(null);

  // Queries
  const { data: walletsData, isFetching: walletsFetching, error: walletsError } = useWallets({ skip: listSkip, limit: listLimit });
  const wallets = walletsData?.data || [];
  const walletsCount = walletsData?.count || 0;

  const { data: walletDetail, isLoading: walletLoading, error: walletError } = useWallet(selectedUserId);
  const wallet = walletDetail;

  const { data: txResponse, isFetching: txFetching } = useWalletTransactions(selectedWalletId, { skip: txSkip, limit: txLimit });
  const transactions = Array.isArray(txResponse) ? txResponse : txResponse?.data || txResponse?.items || txResponse?.transactions || [];
  const txCount = txResponse?.count || 0;

  // Mutations
  const addBalance = useAddBalance();
  const withdraw = useWithdraw();
  const updateStatus = useUpdateWalletStatus();
  const transfer = useTransfer();

  useEffect(() => { if (walletsError) toast.error(walletsError.message || "Failed to load wallets"); }, [walletsError]);
  useEffect(() => { if (walletError) toast.error(walletError.message || "Failed to load wallet detail"); }, [walletError]);

  const handleViewDetails = (walletObj) => {
    setSelectedWalletId(walletObj.id);
    setSelectedUserId(walletObj.userId);
    setTxSkip(0);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedWalletId(null);
    setSelectedUserId(null);
  };

  const extractDriverProfileId = (driver) => {
    if (!driver) return "";
    
    // If it's a manually entered ID from UserAutocomplete
    if (driver.fullName?.startsWith("User ID:")) {
      return driver.id; // Treat the manual input as the driverProfileId
    }
    
    // Extract actual driverProfileId from the driver object
    const profileId = driver.driverProfileId || driver.driverProfile?.id || driver.driverProfile?._id ||driver.driverProfile.userId;
    console.log(profileId,"profileId","  dsadddd", driver)
    
    if (!profileId) {
      toast.error(`المستخدم المحدد (${driver.fullName}) ليس لديه Driver Profile ID صالح.`);
      return "";
    }
    
    return profileId;
  };

  const handleFromDriverSelect = (driver) => {
    setSelectedFromDriver(driver);
    setTransferForm(prev => ({
      ...prev,
      fromDriverProfileId: extractDriverProfileId(driver)
    }));
  };

  const handleToDriverSelect = (driver) => {
    setSelectedToDriver(driver);
    setTransferForm(prev => ({
      ...prev,
      toDriverProfileId: extractDriverProfileId(driver)
    }));
  };

  const closeTransferModal = () => {
    setTransferForm({ fromDriverProfileId: "", toDriverProfileId: "", amount: "", description: "" });
    setSelectedFromDriver(null);
    setSelectedToDriver(null);
    setTransferOpen(false);
  };

  const handleAddBalance = async () => {
    if (!addForm.amount || Number(addForm.amount) <= 0) { toast.warning("Enter a valid amount"); return; }
    try {
      await addBalance.mutateAsync({ userId: selectedUserId, amount: Number(addForm.amount), description: addForm.description });
      toast.success("Balance added successfully");
      setAddForm({ amount: "", description: "" });
      setAddOpen(false);
    } catch (e) { toast.error(e.message || "Failed to add balance"); }
  };

  const handleWithdraw = async () => {
    if (!withdrawForm.amount || Number(withdrawForm.amount) <= 0) { toast.warning("Enter a valid amount"); return; }
    try {
      await withdraw.mutateAsync({ userId: selectedUserId, amount: Number(withdrawForm.amount), description: withdrawForm.description });
      toast.success("Withdrawal completed successfully");
      setWithdrawForm({ amount: "", description: "" });
      setWithdrawOpen(false);
    } catch (e) { toast.error(e.message || "Failed to withdraw"); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus.mutateAsync({ userId: selectedUserId, status: newStatus });
      toast.success(`Wallet status changed to ${newStatus}`);
    } catch (e) { toast.error(e.message || "Failed to update status"); }
  };

  const handleTransfer = async () => {
    if (!transferForm.fromDriverProfileId || !transferForm.toDriverProfileId || !transferForm.amount || Number(transferForm.amount) <= 0) {
      toast.warning("All fields are required");  return;
    }
    try {
      await transfer.mutateAsync({
        fromDriverProfileId: transferForm.fromDriverProfileId,
        toDriverProfileId: transferForm.toDriverProfileId,
        amount: Number(transferForm.amount),
        description: transferForm.description,
      });
      toast.success("Transfer completed successfully");
      closeTransferModal();
    } catch (e) { toast.error(e.message || "Transfer failed"); }
  };

  // Columns for the Main Wallets List
  const walletColumns = useMemo(() => [
    { header: "User", accessorKey: "user.fullName", cell: ({ row }) => <span className="font-medium text-foreground">{row.original.user?.fullName || "—"}</span> },
    { header: "Email", accessorKey: "user.email", cell: ({ row }) => <span className="text-foreground/80">{row.original.user?.email || "—"}</span> },
    { header: "Phone", accessorKey: "user.phoneNumber", cell: ({ row }) => <span className="text-foreground/80">{row.original.user?.phoneNumber || "—"}</span> },
    { header: "Balance", accessorKey: "balance", cell: ({ row }) => <span className="font-bold text-foreground font-mono">{Number(row.original.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
    { header: "Currency", accessorKey: "currency", cell: ({ row }) => <span className="text-foreground/60 font-bold uppercase">{row.original.currency || "—"}</span> },
    { header: "Status", accessorKey: "status", cell: ({ row }) => {
        const s = row.original.status?.toUpperCase() || "ACTIVE";
        return (
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[s] || STATUS_COLORS.ACTIVE}`}>
            {s}
          </span>
        );
      }
    },
    { header: "Updated At", accessorKey: "updatedAt", cell: ({ row }) => <span className="font-mono text-foreground/60 text-xs">{new Date(row.original.updatedAt).toLocaleDateString()}</span> },
    { header: "Actions", id: "actions", cell: ({ row }) => (
        <button
          onClick={() => handleViewDetails(row.original)}
          className="p-2 rounded-xl bg-foreground/5 hover:bg-[#4880FF]/10 text-[#4880FF] transition-colors"
          title="View Details"
        >
          <Eye size={16} />
        </button>
      )
    }
  ], []);

  // Columns for the Transactions List
  const txColumns = useMemo(() => [
    { header: "Type", accessorKey: "type", cell: ({ row }) => {
        const txType = String(row.original.type || row.original.transactionType || "—").toUpperCase();
        return <span className={`text-xs font-bold uppercase tracking-wider ${TX_TYPE_COLORS[txType] || "text-foreground"}`}>{txType}</span>;
      }
    },
    { header: "Amount", accessorKey: "amount", cell: ({ row }) => <span className="font-mono text-foreground font-bold whitespace-nowrap">{Number(row.original.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
    { header: "Balance Before", accessorKey: "balanceBefore", cell: ({ row }) => <span className="font-mono text-foreground/60 text-xs whitespace-nowrap">{row.original.balanceBefore != null ? Number(row.original.balanceBefore).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}</span> },
    { header: "Balance After", accessorKey: "balanceAfter", cell: ({ row }) => <span className="font-mono text-foreground/60 text-xs whitespace-nowrap">{row.original.balanceAfter != null ? Number(row.original.balanceAfter).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}</span> },
    { header: "Description", accessorKey: "description", cell: ({ row }) => <span className="text-foreground/60 text-xs max-w-[200px] truncate block" title={row.original.description}>{row.original.description || "—"}</span> },
    { header: "Date", accessorKey: "createdAt", cell: ({ row }) => <span className="font-mono text-foreground/40 text-xs whitespace-nowrap">{row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "—"}</span> }
  ], []);

  const walletStatus = wallet?.status?.toUpperCase() || "ACTIVE";

  const listCurrentPage = Math.floor(listSkip / listLimit) + 1;
  const listTotalPages = Math.max(1, Math.ceil(walletsCount / listLimit));

  const txCurrentPage = Math.floor(txSkip / txLimit) + 1;
  const txTotalPages = Math.max(1, Math.ceil(txCount / txLimit));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

      {/* ──── Header ──── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#4880FF]/10 text-[#4880FF]">
            <Wallet size={28} />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">
              {view === "list" ? "Wallets" : "Wallet Details"}
            </h1>
            <p className="text-foreground text-sm mt-0.5">
              {view === "list" ? "Manage and monitor all user wallets" : "View wallet details and transaction history"}
            </p>
          </div>
        </div>

        {view === "list" && (
          <div className="relative w-full md:w-96">
            <button 
              onClick={() => setTransferOpen(true)}
              className="w-full px-6 py-3.5 rounded-2xl bg-[#4880FF] text-white! font-bold hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 flex items-center justify-center gap-2"
            >
              <ArrowRightLeft size={18} />
              Driver Transfer
            </button>
          </div>
        )}

        {view === "detail" && (
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all"
          >
            <ChevronLeft size={18} />
            Back to Wallets
          </button>
        )}
      </div>

      {/* ──── Wallets List View ──── */}
      {view === "list" && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
            <UsersTable columns={walletColumns} data={wallets} loading={walletsFetching} />
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-foreground text-xs font-medium bg-foreground/5 px-4 py-2 rounded-full border border-border-subtle">
              Page {listCurrentPage} of {listTotalPages} ({walletsCount} total)
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setListSkip(Math.max(listSkip - listLimit, 0))}
                disabled={listSkip === 0}
                className="px-6 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setListSkip(listSkip + listLimit < walletsCount ? listSkip + listLimit : listSkip)}
                disabled={listSkip + listLimit >= walletsCount}
                className="px-6 py-2.5 rounded-xl bg-[#4880FF] text-white! font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Wallet Details View ──── */}
      {view === "detail" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {walletLoading ? (
             <div className="flex flex-col items-center justify-center p-12 text-foreground/40">
               <Loader2 className="h-8 w-8 animate-spin text-[#4880FF] mb-4" />
               <span className="text-xs uppercase tracking-widest font-semibold">Loading wallet…</span>
             </div>
          ) : !wallet ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-red-500/20 rounded-3xl bg-red-500/10 min-h-[200px]">
              <AlertTriangle className="h-9 w-9 mb-3 text-red-400" />
              <h3 className="text-foreground font-bold uppercase tracking-wide text-sm">Wallet Not Found</h3>
            </div>
          ) : (
            <>
              {/* Overview Card */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                {/* Balance + Info */}
                <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
                  <div className="px-6 py-5 border-b border-border-subtle bg-foreground/5 flex items-center justify-between">
                    <span className="text-foreground/60 text-xs font-bold uppercase tracking-wider">Wallet Overview</span>
                    <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[walletStatus] || STATUS_COLORS.ACTIVE}`}>
                      {walletStatus}
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Balance */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-foreground tracking-tight">
                        {Number(wallet.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-foreground/40 text-sm font-bold uppercase">{wallet.currency || "—"}</span>
                    </div>

                    {/* User Info */}
                    {wallet.user && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoItem icon={User} label="Full Name" value={wallet.user.fullName} />
                        <InfoItem icon={Mail} label="Email" value={wallet.user.email} />
                        <InfoItem icon={Phone} label="Phone" value={wallet.user.phoneNumber} />
                        <InfoItem icon={Car} label="Driver Profile ID" value={wallet.user.driverProfileId} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
                  <div className="px-6 py-5 border-b border-border-subtle bg-foreground/5">
                    <span className="text-foreground/60 text-xs font-bold uppercase tracking-wider">Actions</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <ActionBtn icon={Plus} label="Add Balance" color="green" onClick={() => setAddOpen(true)} />
                    <ActionBtn icon={Minus} label="Withdraw" color="red" onClick={() => setWithdrawOpen(true)} />

                    <div className="pt-3 border-t border-border-subtle space-y-2">
                      <span className="text-foreground/40 text-xs font-bold uppercase ml-1">Change Status</span>
                      <div className="flex gap-2">
                        {["ACTIVE", "FROZEN", "CLOSED"].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            disabled={updateStatus.isPending || walletStatus === s}
                            className={`flex-1 px-3 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                              walletStatus === s
                                ? STATUS_COLORS[s]
                                : "border-border-subtle bg-foreground/5 text-foreground/40 hover:bg-foreground/10"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ──── Transactions Table ──── */}
              <div className="space-y-4">
                <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
                  <div className="px-6 py-4 border-b border-border-subtle bg-foreground/5 flex items-center justify-between">
                    <span className="text-foreground/60 text-xs font-bold uppercase tracking-wider">
                      Transaction History
                    </span>
                  </div>
                  
                  <UsersTable columns={txColumns} data={transactions} loading={txFetching} />
                </div>

                {/* Tx Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                  <div className="text-foreground text-xs font-medium bg-foreground/5 px-4 py-2 rounded-full border border-border-subtle">
                    Page {txCurrentPage} of {txTotalPages} ({txCount} total)
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setTxSkip(Math.max(txSkip - txLimit, 0))}
                      disabled={txSkip === 0}
                      className="px-6 py-2.5 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setTxSkip(txSkip + txLimit < txCount ? txSkip + txLimit : txSkip)}
                      disabled={txSkip + txLimit >= txCount}
                      className="px-6 py-2.5 rounded-xl bg-[#4880FF] text-white! font-bold text-sm hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ MODALS ═══════ */}

      {/* Add Balance Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Balance" icon={Plus}>
        <div className="space-y-2"><FieldLabel>Amount</FieldLabel><Input type="number" min="0" step="0.01" placeholder="0.00" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })} /></div>
        <div className="space-y-2"><FieldLabel>Description</FieldLabel><Input placeholder="Reason for deposit…" value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} /></div>
        <PrimaryBtn disabled={addBalance.isPending} onClick={handleAddBalance}>Add Balance</PrimaryBtn>
      </Modal>

      {/* Withdraw Modal */}
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw Funds" icon={Minus}>
        <div className="space-y-2"><FieldLabel>Amount</FieldLabel><Input type="number" min="0" step="0.01" placeholder="0.00" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} /></div>
        <div className="space-y-2"><FieldLabel>Description</FieldLabel><Input placeholder="Reason for withdrawal…" value={withdrawForm.description} onChange={(e) => setWithdrawForm({ ...withdrawForm, description: e.target.value })} /></div>
        <PrimaryBtn disabled={withdraw.isPending} onClick={handleWithdraw}>Withdraw</PrimaryBtn>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={transferOpen} onClose={closeTransferModal} title="Driver Transfer" icon={ArrowRightLeft}>
        <div className="space-y-2">
          <FieldLabel>From Driver</FieldLabel>
          <UserAutocomplete
            placeholder="Search source driver…"
            value={selectedFromDriver}
            onChange={handleFromDriverSelect}
            filterType="driver"
            allowManualId={true}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>To Driver</FieldLabel>
          <UserAutocomplete
            placeholder="Search destination driver…"
            value={selectedToDriver}
            onChange={handleToDriverSelect}
            filterType="driver"
            allowManualId={true}
          />
        </div>
        <div className="space-y-2"><FieldLabel>Amount</FieldLabel><Input type="number" min="0" step="0.01" placeholder="0.00" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} /></div>
        <div className="space-y-2"><FieldLabel>Description</FieldLabel><Input placeholder="Transfer note…" value={transferForm.description} onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })} /></div>
        <PrimaryBtn disabled={transfer.isPending} onClick={handleTransfer}>Transfer Funds</PrimaryBtn>
      </Modal>
    </div>
  );
}

/* ───────── Tiny sub-components ───────── */

/* eslint-disable no-unused-vars */
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 bg-foreground/5 rounded-2xl px-4 py-3 border border-border-subtle">
      <Icon size={16} className="text-[#4880FF] shrink-0" />
      <div className="min-w-0">
        <div className="text-foreground/40 text-[10px] font-bold uppercase tracking-wider">{label}</div>
        <div className="text-foreground text-sm font-medium truncate">{value || "—"}</div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color, onClick }) {
  const colorMap = {
    green: "hover:border-green-500/30 hover:text-green-500 hover:bg-green-500/5",
    red: "hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5",
    indigo: "hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/5",
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border-subtle bg-foreground/5 text-foreground/60 font-bold text-sm transition-all ${colorMap[color] || ""}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
