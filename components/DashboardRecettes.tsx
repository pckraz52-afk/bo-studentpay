import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import { Transaction, TransactionType } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatDateLabel(date: Date) {
  return `${date.getDate().toString().padStart(2, '0')} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function aggregate(txs: Transaction[], startDate: Date, endDate: Date) {
  const days = getDaysBetween(startDate, endDate);

  const labels: string[] = [];
  const values: number[] = [];

  if (days <= 31) {
    // Day-by-day
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const sum = txs
        .filter(tx => { const t = tx.createdAt ? new Date(tx.createdAt) : null; return t && t >= start && t <= end; })
        .reduce((s, t) => s + (t.amount || 0), 0);
      labels.push(`${d.getDate().toString().padStart(2, '0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`);
      values.push(Math.round((sum / 1000) * 10) / 10);
    }
  } else if (days <= 366) {
    // Month-by-month
    const startY = startDate.getFullYear(), startM = startDate.getMonth();
    const endY = endDate.getFullYear(), endM = endDate.getMonth();
    const totalMonths = (endY - startY) * 12 + (endM - startM) + 1;
    for (let i = 0; i < totalMonths; i++) {
      const year = startY + Math.floor((startM + i) / 12);
      const month = (startM + i) % 12;
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const sum = txs
        .filter(tx => { const t = tx.createdAt ? new Date(tx.createdAt) : null; return t && t >= start && t <= end; })
        .reduce((s, t) => s + (t.amount || 0), 0);
      labels.push(`${monthNames[month]} ${year}`);
      values.push(Math.round((sum / 1000) * 10) / 10);
    }
  } else {
    // Year-by-year
    for (let y = startDate.getFullYear(); y <= endDate.getFullYear(); y++) {
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59, 999);
      const sum = txs
        .filter(tx => { const t = tx.createdAt ? new Date(tx.createdAt) : null; return t && t >= start && t <= end; })
        .reduce((s, t) => s + (t.amount || 0), 0);
      labels.push(`${y}`);
      values.push(Math.round((sum / 1000) * 10) / 10);
    }
  }

  return { labels, values };
}

const DashboardRecettes: React.FC = () => {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(monthAgo);
  const [endDate, setEndDate] = useState<Date>(today);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.transactions
      .getAll({ type: TransactionType.PAYMENT })
      .then(res => { if (!cancelled) setTransactions(res || []); })
      .catch(err => { if (!cancelled) setError(String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const { labels, values } = aggregate(transactions || [], startDate, endDate);
  const total = values.reduce((a, b) => a + b, 0);
  const days = getDaysBetween(startDate, endDate);
  const granularity = days <= 31 ? 'Jour' : days <= 366 ? 'Mois' : 'Année';

  const data = {
    labels,
    datasets: [
      {
        label: "Recettes (kAr)",
        data: values,
        backgroundColor: 'rgba(99,102,241,0.75)',
        hoverBackgroundColor: 'rgba(79,70,229,0.95)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.y} kAr`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: { callback: (v: any) => `${v} kAr`, color: '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          maxRotation: labels.length > 12 ? 45 : 0,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-1">Recettes cantine</h3>
      <p className="text-sm text-gray-500 mb-4">Encaissements de la cantine sur la période sélectionnée.</p>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100" style={{ minHeight: 340 }}>
        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Total recettes</div>
            <div className="text-3xl font-bold text-slate-800">{total.toLocaleString()} kAr</div>
            <div className="text-xs text-slate-400 mt-0.5">Granularité : <span className="font-medium text-indigo-500">{granularity}</span></div>
          </div>

          {/* Date range picker */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-medium">Date de début</label>
              <input
                type="date"
                value={formatInputDate(startDate)}
                max={formatInputDate(endDate)}
                onChange={e => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime()) && d <= endDate) setStartDate(d);
                }}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 font-medium">Date de fin</label>
              <input
                type="date"
                value={formatInputDate(endDate)}
                min={formatInputDate(startDate)}
                max={formatInputDate(today)}
                onChange={e => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime()) && d >= startDate) setEndDate(d);
                }}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
              />
            </div>

            {/* Quick presets */}
            <div className="flex gap-1.5 self-end pb-0.5">
              {[
                { label: '7j',  fn: () => { const s = new Date(today); s.setDate(today.getDate() - 6); setStartDate(s); setEndDate(today); } },
                { label: '1m',  fn: () => { const s = new Date(today); s.setMonth(today.getMonth() - 1); setStartDate(s); setEndDate(today); } },
                { label: '3m',  fn: () => { const s = new Date(today); s.setMonth(today.getMonth() - 3); setStartDate(s); setEndDate(today); } },
                { label: '1a',  fn: () => { const s = new Date(today); s.setFullYear(today.getFullYear() - 1); setStartDate(s); setEndDate(today); } },
                { label: '3a',  fn: () => { const s = new Date(today); s.setFullYear(today.getFullYear() - 3); setStartDate(s); setEndDate(today); } },
              ].map(({ label, fn }) => (
                <button
                  key={label}
                  onClick={fn}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Period display */}
        <div className="text-xs text-slate-400 mb-3">
          {formatDateLabel(startDate)} → {formatDateLabel(endDate)}
        </div>

        {/* Chart */}
        <div style={{ height: 240 }}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-slate-400">Chargement…</div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-sm text-red-400">Erreur : {error}</div>
          ) : (
            <Bar data={data} options={options} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardRecettes;



