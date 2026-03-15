import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';

const HOURS = [
  { day: 'Lundi',    hours: '09:00 – 19:00' },
  { day: 'Mardi',    hours: '09:00 – 19:00' },
  { day: 'Mercredi', hours: '09:00 – 19:00' },
  { day: 'Jeudi',    hours: '09:00 – 20:00' },
  { day: 'Vendredi', hours: '09:00 – 20:00' },
  { day: 'Samedi',   hours: '09:00 – 18:00' },
  { day: 'Dimanche', hours: 'Fermé'          },
];

export default function ContactPage() {
  return (
    <PublicLayout>
      <section className="min-h-screen px-6 pt-40 pb-24">
        <div className="max-w-4xl mx-auto">

          {/* Heading */}
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs text-amber-400/60 uppercase tracking-[0.35em]">Contact</p>
            <h1 className="text-5xl font-thin text-white">Nous trouver</h1>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">

            {/* Info card */}
            <div className="glass p-8 space-y-7 flex flex-col justify-between">
              <div className="space-y-6">
                <h2 className="text-base font-light text-white/70">Informations</h2>

                {[
                  { label: 'Adresse',    value: process.env.NEXT_PUBLIC_SALON_ADDRESS },
                  { label: 'Téléphone',  value: process.env.NEXT_PUBLIC_SALON_PHONE   },
                  { label: 'E-mail',     value: process.env.NEXT_PUBLIC_SALON_EMAIL   },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-[10px] text-white/25 uppercase tracking-[0.2em]">{label}</p>
                    <p className="text-sm text-white/65">{value}</p>
                  </div>
                ))}
              </div>

              <Link href="/rdv" className="btn-amber text-sm text-center block">
                Réserver en ligne
              </Link>
            </div>

            {/* Hours card */}
            <div className="glass p-8 space-y-6">
              <h2 className="text-base font-light text-white/70">Horaires</h2>
              <div className="space-y-0">
                {HOURS.map(({ day, hours }, i) => (
                  <div
                    key={day}
                    className={`flex justify-between items-center py-3 ${
                      i < HOURS.length - 1 ? 'border-b border-white/[0.05]' : ''
                    }`}
                  >
                    <span className="text-sm text-white/50">{day}</span>
                    <span className={`text-sm ${hours === 'Fermé' ? 'text-white/20' : 'text-white/65'}`}>
                      {hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="mt-5 glass overflow-hidden h-56 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-3xl opacity-30">◎</p>
              <p className="text-sm text-white/25">{process.env.NEXT_PUBLIC_SALON_ADDRESS}</p>
            </div>
          </div>

        </div>
      </section>
    </PublicLayout>
  );
}
