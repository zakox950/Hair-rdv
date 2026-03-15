'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReservationList from './ReservationList';

interface Settings {
  enhanced_security_mode: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [togglingMode, setTogglingMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservations' | 'settings'>('reservations');

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      setSettings(await res.json() as Settings);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  async function toggleEnhancedMode() {
    if (!settings) return;
    setTogglingMode(true);
    const next = settings.enhanced_security_mode !== 'true';
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enhanced_security_mode: next }),
    });
    setSettings((prev) =>
      prev ? { ...prev, enhanced_security_mode: String(next) } : prev
    );
    setTogglingMode(false);
  }

  const enhancedOn = settings?.enhanced_security_mode === 'true';

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <nav className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1">
          {(['reservations', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab === 'reservations' ? 'Réservations' : 'Paramètres'}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Déconnexion
        </button>
      </div>

      {/* Reservations tab */}
      {activeTab === 'reservations' && <ReservationList />}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-stone-900">Paramètres</h2>

          <div className="flex items-center justify-between py-4 border-t border-stone-100">
            <div>
              <p className="font-medium text-stone-900">Mode sécurité renforcée</p>
              <p className="text-sm text-stone-500 mt-0.5">
                Limite à 3 réservations par IP par tranche de 24 h.
              </p>
            </div>
            <button
              onClick={toggleEnhancedMode}
              disabled={togglingMode || settings === null}
              aria-pressed={enhancedOn}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 ${
                enhancedOn ? 'bg-brand-600' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  enhancedOn ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
