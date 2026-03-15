'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface AnalyticsData {
  reservations_par_jour: { jour: string; count: string }[];
  repartition_statuts:   { status: string; count: string }[];
  trafic_par_jour:       { jour: string; count: string }[];
  taux_remplissage:      { coiffeur: string; total: string; reserves: string }[];
  kpi: {
    total: number;
    taux_confirmation: number;
    taux_annulation:   number;
    taux_no_show:      number;
    taux_presence:     number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending:              '#F59E0B',
  pending_verification: '#8B5CF6',
  confirmed:            '#10B981',
  cancelled:            '#EF4444',
  present:              '#06B6D4',
  no_show:              '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  pending:              'En attente',
  pending_verification: 'Vérification',
  confirmed:            'Confirmé',
  cancelled:            'Annulé',
  present:              'Présent',
  no_show:              'No-show',
};

const CHART_STYLE = {
  fontSize: 11,
  fill: 'rgba(255,255,255,0.4)',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then((d: AnalyticsData) => { setData(d); setLoading(false); })
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-white/40 text-sm pt-20 text-center">Chargement des données…</p>
      </AdminLayout>
    );
  }
  if (!data) return <AdminLayout><p className="text-red-400 text-sm">Erreur de chargement.</p></AdminLayout>;

  const rdvData = data.reservations_par_jour.map(r => ({
    jour: r.jour.slice(5), // MM-DD
    count: Number(r.count),
  }));

  const traficData = data.trafic_par_jour.map(r => ({
    jour: r.jour.slice(5),
    count: Number(r.count),
  }));

  const statutsData = data.repartition_statuts.map(r => ({
    name:  STATUS_LABELS[r.status] ?? r.status,
    value: Number(r.count),
    color: STATUS_COLORS[r.status] ?? '#888',
  }));

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <p className="text-xs text-amber-400/60 uppercase tracking-[0.3em] mb-1">Administration</p>
          <h1 className="text-3xl font-thin text-white">Analytiques</h1>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total RDV',       value: data.kpi.total,             suffix: '' },
            { label: 'Taux confirmation', value: data.kpi.taux_confirmation, suffix: '%' },
            { label: 'Taux annulation',  value: data.kpi.taux_annulation,   suffix: '%' },
            { label: 'Taux no-show',     value: data.kpi.taux_no_show,      suffix: '%' },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="glass p-5 text-center">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">{label}</p>
              <p className="text-3xl font-thin text-amber-400">{value}{suffix}</p>
            </div>
          ))}
        </div>

        {/* Réservations par jour */}
        <div className="glass p-6 space-y-4">
          <h2 className="text-base font-light text-white/70">Réservations / jour (30 j)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rdvData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="jour" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                itemStyle={{ color: '#F59E0B' }}
              />
              <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Réservations" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trafic + Statuts */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="glass p-6 space-y-4">
            <h2 className="text-base font-light text-white/70">Trafic visiteurs (30 j)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={traficData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="jour" tick={CHART_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  itemStyle={{ color: '#8B5CF6' }}
                />
                <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Visiteurs" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass p-6 space-y-4">
            <h2 className="text-base font-light text-white/70">Répartition des statuts</h2>
            {statutsData.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statutsData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {statutsData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Taux remplissage par coiffeur */}
        <div className="glass p-6 space-y-4">
          <h2 className="text-base font-light text-white/70">Remplissage par coiffeur (7 prochains jours)</h2>
          <div className="space-y-3">
            {data.taux_remplissage.length === 0 && <p className="text-white/30 text-sm">Aucun créneau configuré.</p>}
            {data.taux_remplissage.map(c => {
              const total   = Number(c.total);
              const reserves = Number(c.reserves);
              const pct      = total > 0 ? Math.round((reserves / total) * 100) : 0;
              return (
                <div key={c.coiffeur} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{c.coiffeur}</span>
                    <span className="text-white/40">{reserves} / {total} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 80 ? '#EF4444' : pct >= 50 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
