import Navbar from '@/components/Navbar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#06060f] text-white relative overflow-x-hidden">

      {/* ── Background orbs (fixed, behind everything) ─────────── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -right-[15%] w-[750px] h-[750px] rounded-full bg-violet-600/[0.13] blur-[160px]" />
        <div className="absolute -bottom-[15%] -left-[15%] w-[650px] h-[650px] rounded-full bg-teal-500/[0.10] blur-[140px]" />
        <div className="absolute top-[40%] left-[25%]  w-[500px] h-[500px] rounded-full bg-blue-600/[0.07] blur-[130px]" />
      </div>

      <Navbar />

      <main>{children}</main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="mt-24 border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-white/25 text-xs">
          <p>© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SALON_NAME}</p>
          <div className="flex gap-6">
            <span>{process.env.NEXT_PUBLIC_SALON_PHONE}</span>
            <span>{process.env.NEXT_PUBLIC_SALON_EMAIL}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
