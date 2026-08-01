import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateEmployee } from "../../../hooks/api/useUsers";
import { useRoles } from "../../../hooks/api/useRoles";

export default function CreateEmployeeModal({ onClose }) {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    roleId: "",
  });

  const { data: rolesData, isLoading: loadingRoles } = useRoles({ limit: 100 });
  const roles = rolesData?.data || [];

  const createEmployeeMutation = useCreateEmployee();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.roleId) {
      toast.error("Please select a role.");
      return;
    }

    createEmployeeMutation.mutate(
      {
        ...formData,
        roleId: Number(formData.roleId),
      },
      {
        onSuccess: () => {
          toast.success("Employee created successfully!");
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create employee.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md rounded-3xl border border-border-subtle shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <h2 className="text-xl font-bold text-foreground">Create Employee</h2>
          <button
            onClick={onClose}
            className="p-2 text-foreground hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Full Name</label>
            <input
              required
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Email</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
              placeholder="e.g. employee@company.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Phone Number</label>
            <input
              required
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
              placeholder="e.g. 1333333333"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Password</label>
            <input
              required
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
              placeholder="Minimum 6 characters"
              minLength={6}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Role</label>
            <select
              required
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              disabled={loadingRoles}
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all disabled:opacity-50"
            >
              <option value="" disabled>Select a role...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border-subtle bg-foreground/5 text-foreground font-bold hover:bg-foreground/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEmployeeMutation.isPending}
              className="flex-1 px-4 py-3 rounded-xl bg-[#4880FF] text-white font-bold hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {createEmployeeMutation.isPending && <Loader2 size={18} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
