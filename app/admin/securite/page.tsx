'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Settings { enhanced_security_mode: string; no_show_threshold: string; }
interface BlacklistEntry { email: string; reason: string; created_at: string; }

export default function SecuritePage() {
  const [settings, setSettings]   = useState<Settings | null>(null);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [saving, setSaving]       = useState(false);

  const fetchAll = useCallback(async () => {
    const [sRes, bRes] = await Promise.all([
      fetch('/api/admin/settings'),
      fetch('/api/admin/blacklist'),
    ]);
    if (sRes.ok) setSettings(await sRes.json() as Settings);
    if (bRes.ok) setBlacklist(await bRes.json() as BlacklistEntry[]);
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enhanced_security_mode: settings.enhanced_security_mode === 'true' }),
    });
    await fetch('/api/admin/settings/key', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'no_show_threshold', value: settings.no_show_threshold }),
    }).catch(() => {});
    setSaving(false);
  }

  async function unblacklist(email: string) {
    await fetch(`/api/admin/blacklist/${encodeURIComponent(email)}`, { method: 'DELETE' });
    setBlacklist(prev => prev.filter(b => b.email !== email));
  }

  const enhancedOn = settings?.enhanced_security_mode === 'true';

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <p className="text-xs text-amber-400/60 uppercase tracking-[0.3em] mb-1">Administration</p>
          <h1 className="text-3xl font-thin text-white">Sécurité</h1>
        </div>

        {/* Settings */}
        {settings && (
          <div className="glass p-6 space-y-6">
            <h2 className="text-base font-light text-white/70">Paramètres anti-spam</h2>

            <div className="flex items-center justify-between py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-sm font-medium text-white/80">Mode sécurité renforcée</p>
                <p className="text-xs text-white/40 mt-1">
                  Oblige la vérification email pour les nouveaux clients.
                  {enhancedOn && <span className="ml-2 badge-amber">Actif</span>}
                </p>
              </div>
              <button
                onClick={() => setSettings(prev => prev
                  ? { ...prev, enhanced_security_mode: prev.enhanced_security_mode === 'true' ? 'false' : 'true' }
                  : prev
                )}
                className={`toggle-track ${enhancedOn ? 'active' : ''}`}
                aria-pressed={enhancedOn}
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            <div className="py-4">
              <label className="label-dark">Seuil de blacklist (no-shows consécutifs)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.no_show_threshold}
                onChange={e => setSettings(prev => prev ? { ...prev, no_show_threshold: e.target.value } : prev)}
                className="input-dark max-w-xs"
              />
              <p className="text-xs text-white/35 mt-2">Un client sera blacklisté automatiquement après ce nombre de no-shows.</p>
            </div>

            <button onClick={saveSettings} disabled={saving} className="btn-amber">
              {saving ? 'Sauvegarde…' : 'Enregistrer'}
            </button>
          </div>
        )}

        {/* Blacklist */}
        <div className="glass p-6 space-y-4">
          <h2 className="text-base font-light text-white/70">
            Emails blacklistés <span className="badge-red ml-2">{blacklist.length}</span>
          </h2>
          {blacklist.length === 0 && <p className="text-white/30 text-sm">Aucun email blacklisté.</p>}
          <div className="space-y-3">
            {blacklist.map(b => (
              <div key={b.email} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-sm text-white/80">{b.email}</p>
                  <p className="text-xs text-white/35 mt-0.5">{b.reason} · {new Date(b.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <button onClick={() => unblacklist(b.email)} className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
