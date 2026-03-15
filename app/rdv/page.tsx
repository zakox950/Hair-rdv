import PublicLayout from '@/components/PublicLayout';
import BookingForm from '@/components/BookingForm';

export default function RdvPage() {
  const services = (process.env.NEXT_PUBLIC_SERVICES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <PublicLayout>
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-36 pb-24">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs text-amber-400/60 uppercase tracking-[0.35em]">Réservation</p>
            <h1 className="text-4xl font-thin text-white">Prendre rendez-vous</h1>
            <p className="text-white/40 text-sm">Choisissez votre coiffeur, votre date et votre créneau.</p>
          </div>

          <BookingForm services={services} />
        </div>
      </section>
    </PublicLayout>
  );
}
