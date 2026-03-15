import PublicLayout from '@/components/PublicLayout';

export default function ConfidentialitePage() {
  const salon = process.env.NEXT_PUBLIC_SALON_NAME  ?? 'le salon';
  const email = process.env.NEXT_PUBLIC_SALON_EMAIL ?? '';

  return (
    <PublicLayout>
      <section className="min-h-screen px-6 pt-36 pb-24 max-w-2xl mx-auto">
        <div className="space-y-10">
          <div className="space-y-3">
            <p className="text-xs text-amber-400/60 uppercase tracking-[0.35em]">Légal</p>
            <h1 className="text-4xl font-thin text-white">Politique de confidentialité</h1>
            <p className="text-white/40 text-sm">Dernière mise à jour : mars 2026</p>
          </div>

          <Section title="Données collectées">
            <p>
              Lors de votre prise de rendez-vous, {salon} collecte les informations suivantes :
            </p>
            <ul>
              <li>Nom complet</li>
              <li>Adresse e-mail</li>
              <li>Numéro de téléphone</li>
              <li>Date et heure du rendez-vous souhaité</li>
              <li>Prestation choisie</li>
            </ul>
            <p>
              À des fins de sécurité, une empreinte anonymisée de votre adresse IP
              (hachage SHA-256 salé, non réversible) est conservée pour prévenir les abus.
              L&apos;adresse IP en clair n&apos;est jamais stockée.
            </p>
          </Section>

          <Section title="Finalité du traitement">
            <p>Ces données sont utilisées exclusivement pour :</p>
            <ul>
              <li>La gestion et la confirmation de votre rendez-vous</li>
              <li>L&apos;envoi d&apos;un e-mail de confirmation</li>
              <li>La prévention des abus et du spam</li>
            </ul>
          </Section>

          <Section title="Durée de conservation">
            <p>
              Vos données de réservation sont conservées pendant <strong className="text-white/80">90 jours</strong> après
              la date du rendez-vous, puis supprimées automatiquement.
              Les données de trafic anonymisées sont supprimées après <strong className="text-white/80">30 jours</strong>.
            </p>
          </Section>

          <Section title="Vos droits">
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification
              et de suppression de vos données. Pour exercer ces droits, contactez-nous à :
            </p>
            {email && (
              <p>
                <a href={`mailto:${email}`} className="text-amber-400/80 hover:text-amber-400 transition-colors">
                  {email}
                </a>
              </p>
            )}
          </Section>

          <Section title="Aucun partage tiers">
            <p>
              Vos données ne sont jamais vendues, partagées ou transmises à des tiers,
              sauf obligation légale.
            </p>
          </Section>
        </div>
      </section>
    </PublicLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-6 space-y-4">
      <h2 className="text-lg font-light text-white/90">{title}</h2>
      <div className="text-white/50 text-sm leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
