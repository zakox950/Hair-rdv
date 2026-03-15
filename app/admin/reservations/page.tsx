import AdminLayout from '@/components/admin/AdminLayout';
import ReservationList from '@/components/admin/ReservationList';

export default function ReservationsPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <p className="text-xs text-amber-400/60 uppercase tracking-[0.3em] mb-1">Administration</p>
          <h1 className="text-3xl font-thin text-white">Réservations</h1>
        </div>
        <ReservationList />
      </div>
    </AdminLayout>
  );
}
