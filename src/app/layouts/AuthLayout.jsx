export default function AuthLayout({ children, left }) {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <div className="relative min-h-screen overflow-hidden">
        {/* glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full bg-indigo-500/15 blur-3xl" />

        {/* grid */}
        <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-stretch gap-10 px-6 py-10 lg:grid-cols-2 lg:px-10">
          {/* left */}
          <div className="relative flex flex-col justify-center">
            {left}
          </div>

          {/* right */}
          <div className="flex items-center justify-center lg:justify-end">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
