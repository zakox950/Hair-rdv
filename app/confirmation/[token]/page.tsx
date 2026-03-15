'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';

type State = 'loading' | 'success' | 'expired' | 'used' | 'error';

interface ConfirmResponse {
  status: 'confirmed';
  nom: string;
  coiffeur: string;
  date: string;
  heure: string;
}

export default function ConfirmationPage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');
  const [data,  setData]  = useState<ConfirmResponse | null>(null);

  useEffect(() => {
    if (!params?.token) return;
    fetch(`/api/confirmation/${params.token}`)
      .then(async r => {
        if (r.ok) {
          const d = await r.json() as ConfirmResponse;
          setData(d);
          setState('success');
        } else {
          const err = await r.json() as { code?: string };
          if (err.code === 'expired')  setState('expired');
          else if (err.code === 'used') setState('used');
          else setState('error');
        }
      })
      .catch(() => setState('error'));
  }, [params?.token]);

  return (
    <PublicLayout>
      <section className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        <div className="w-full max-w-md">
          {state === 'loading' && (
            <div className="glass p-12 text-center">
              <div className="w-8 h-8 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/40 text-sm">Vérification en cours…</p>
            </div>
          )}

          {state === 'success' && data && (
            <div className="glass p-10 text-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center mx-auto">
                <span className="text-emerald-400 text-2xl">✓</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-thin text-white">Rendez-vous confirmé&nbsp;!</h1>
                <p className="text-white/50 text-sm">Bonjour {data.nom}, votre RDV est bien enregistré.</p>
              </div>
              <div className="glass-sm p-4 space-y-2 text-left">
                <Row label="Coiffeur" value={data.coiffeur} />
                <Row label="Date"     value={new Date(data.date + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
                <Row label="Heure"    value={data.heure} />
              </div>
              <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4">
                Retour à l&apos;accueil
              </Link>
            </div>
          )}

          {state === 'expired' && (
            <div className="glass p-10 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto">
                <span className="text-amber-400 text-2xl">⏱</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-thin text-white">Lien expiré</h1>
                <p className="text-white/50 text-sm">Ce lien de confirmation a expiré (validité 15 min). Prenez un nouveau rendez-vous.</p>
              </div>
              <Link href="/rdv" className="btn-amber inline-block px-8 py-3 text-sm">
                Reprendre une réservation
              </Link>
            </div>
          )}

          {state === 'used' && (
            <div className="glass p-10 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto">
                <span className="text-cyan-400 text-2xl">✓</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-thin text-white">Déjà confirmé</h1>
                <p className="text-white/50 text-sm">Ce rendez-vous a déjà été confirmé. Pas besoin de cliquer à nouveau.</p>
              </div>
              <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4">
                Retour à l&apos;accueil
              </Link>
            </div>
          )}

          {state === 'error' && (
            <div className="glass p-10 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto">
                <span className="text-red-400 text-2xl">!</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-thin text-white">Lien invalide</h1>
                <p className="text-white/50 text-sm">Ce lien de confirmation est invalide ou introuvable.</p>
              </div>
              <Link href="/rdv" className="btn-amber inline-block px-8 py-3 text-sm">
                Faire une réservation
              </Link>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/35">{label}</span>
      <span className="text-white/80 font-medium">{value}</span>
    </div>
  );
}
