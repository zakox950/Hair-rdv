import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import CoiffeursSection from '@/components/CoiffeursSection';

const SERVICES = [
  { icon: '✦', title: 'Coupe Femme',  desc: 'Coupe sur mesure adaptée à votre morphologie et votre style de vie.' },
  { icon: '✦', title: 'Coupe Homme',  desc: 'Du classique au contemporain, exécutée avec précision.' },
  { icon: '◉', title: 'Coloration',   desc: 'Techniques exclusives pour des couleurs vibrantes et durables.' },
  { icon: '◌', title: 'Mèches',       desc: 'Balayage, tie & dye, ombré hair pour un effet naturel et lumineux.' },
  { icon: '—', title: 'Lissage',      desc: 'Lissage brésilien longue durée pour une chevelure soyeuse.' },
  { icon: '∿', title: 'Brushing',     desc: 'Mise en forme et volume sur mesure pour sublimer votre coiffure.' },
  { icon: '❋', title: 'Soin',         desc: 'Soins hydratants et réparateurs pour une chevelure en pleine santé.' },
  { icon: '〜', title: 'Permanente',  desc: 'Ondulations douces ou boucles définies selon vos envies.' },
];

const TESTIMONIALS = [
  {
    quote: 'Sophie a transformé ma routine capillaire. Un balayage parfait, des conseils précieux.',
    name: 'Marie L.',
    role: 'Cliente depuis 3 ans',
  },
  {
    quote: 'Le meilleur salon de Paris. Accueil chaleureux et résultat impeccable à chaque visite.',
    name: 'Thomas R.',
    role: 'Client depuis 2 ans',
  },
  {
    quote: 'Mon brushing tient toujours plusieurs jours. Je ne vais nulle part ailleurs.',
    name: 'Camille D.',
    role: 'Cliente depuis 5 ans',
  },
];

export default function HomePage() {
  return (
    <PublicLayout>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-36 pb-24">
        <div className="max-w-4xl mx-auto text-center space-y-10">

          <div className="inline-flex items-center gap-2 glass-sm px-4 py-2 text-xs text-white/45 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            Salon de coiffure · Paris
          </div>

          <h1 className="text-[clamp(3.2rem,9vw,7rem)] font-thin tracking-tight text-white leading-[0.9]">
            L&apos;art de<br />
            <em className="not-italic text-white/45">sublimer</em><br />
            vos cheveux.
          </h1>

          <p className="text-base text-white/40 max-w-xs mx-auto font-light leading-relaxed">
            Prenez rendez-vous en quelques secondes.
            Notre équipe vous accueille du lundi au samedi.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rdv" className="btn-amber text-center">
              Prendre rendez-vous
            </Link>
            <Link href="#services" className="btn-glass text-center">
              Nos prestations
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-3 max-w-sm mx-auto w-full">
          {[
            { value: '12+',    label: "Années d'expérience" },
            { value: '2 000+', label: 'Clients satisfaits'  },
            { value: '8',      label: 'Prestations'         },
          ].map((s) => (
            <div key={s.label} className="glass text-center p-5">
              <p className="text-2xl font-light text-amber-400">{s.value}</p>
              <p className="text-[10px] text-white/35 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────── */}
      <section id="services" className="px-6 py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs text-amber-400/60 uppercase tracking-[0.35em]">Prestations</p>
            <h2 className="text-4xl font-thin text-white">Nos services</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((s) => (
              <div key={s.title} className="glass p-6 space-y-4">
                <span className="text-xl text-white/15">{s.icon}</span>
                <div>
                  <h3 className="text-sm font-medium text-white/90">{s.title}</h3>
                  <p className="text-xs text-white/40 mt-2 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Notre équipe ─────────────────────────────────────── */}
      <CoiffeursSection />

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section className="px-6 py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs text-amber-400/60 uppercase tracking-[0.35em]">Avis clients</p>
            <h2 className="text-4xl font-thin text-white">Ce qu&apos;ils disent</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass p-7 flex flex-col justify-between gap-5">
                <p className="text-sm text-white/50 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="border-t border-white/[0.06] pt-4">
                  <p className="text-sm font-medium text-white/70">{t.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="glass p-14 text-center space-y-7">
            <h2 className="text-4xl font-thin text-white">Prêt à vous transformer&nbsp;?</h2>
            <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
              Réservez votre créneau en ligne — confirmation sous 24 h.
            </p>
            <Link href="/rdv" className="inline-block btn-amber">
              Prendre rendez-vous
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
