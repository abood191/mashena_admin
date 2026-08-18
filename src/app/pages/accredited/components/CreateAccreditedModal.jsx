import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useCreateAccredited } from "../../../hooks/api/useUsers";

export default function CreateAccreditedModal({ onClose }) {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    file: null,
  });

  const createAccreditedMutation = useCreateAccredited();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, file: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("fullName", formData.fullName);
    fd.append("email", formData.email);
    fd.append("phoneNumber", formData.phoneNumber);
    fd.append("password", formData.password);
    
    // Append file if it has been selected (it is optional)
    if (formData.file) {
      fd.append("file", formData.file);
    }

    createAccreditedMutation.mutate(fd, {
      onSuccess: () => {
        toast.success("Accredited user created successfully!");
        onClose();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to create accredited user.");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md rounded-3xl border border-border-subtle shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <h2 className="text-xl font-bold text-foreground">Create Accredited User</h2>
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
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
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
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
              placeholder="e.g. accredited@mashena.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Phone Number</label>
            <input
              required
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
              placeholder="e.g. 123456789"
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
              className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 transition-all"
              placeholder="Minimum 8 characters"
              minLength={8}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">User Image (Optional)</label>
            <div className="relative border border-dashed border-border-subtle rounded-xl p-4 bg-background flex flex-col items-center justify-center gap-2 hover:bg-foreground/5 transition-all cursor-pointer">
              <input
                type="file"
                name="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
              <Upload size={24} className="text-foreground/50" />
              <span className="text-xs text-foreground/75 font-medium">
                {formData.file ? formData.file.name : "Click or drag to upload image"}
              </span>
            </div>
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
              disabled={createAccreditedMutation.isPending}
              className="flex-1 px-4 py-3 rounded-xl bg-[#4880FF] text-white font-bold hover:bg-[#3d6edb] transition-all shadow-lg shadow-[#4880FF]/25 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {createAccreditedMutation.isPending && <Loader2 size={18} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
