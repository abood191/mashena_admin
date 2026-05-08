export default function Input({ label, type = "text", ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm text-white/70">{label}</label>
      )}
      <input
        type={type}
        className="w-full rounded-xl border border-white/10 bg-[#0b1424]
        px-4 py-3 text-sm text-white placeholder:text-white/30
        outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
        {...props}
      />
    </div>
  );
}
