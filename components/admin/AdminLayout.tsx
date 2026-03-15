import AdminNavbar from '@/components/admin/AdminNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#06060f] text-white relative overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/[0.10] blur-[160px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-teal-500/[0.08] blur-[140px]" />
      </div>

      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 pt-36 pb-16">{children}</main>
    </div>
  );
}
