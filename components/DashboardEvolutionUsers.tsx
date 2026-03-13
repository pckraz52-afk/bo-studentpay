import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { api } from '../services/api';
import { User } from '../types';

const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatDateLabel(date: Date) {
  return `${date.getDate().toString().padStart(2, '0')} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

function getMonthsBetween(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

function buildLabelsAndValues(start: Date, end: Date, totalUsers: number) {
  const days = getDaysBetween(start, end);

  let labels: string[] = [];
  let values: number[] = [];

  if (days <= 31) {
    // Day-by-day
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const year = d.getFullYear();
      const label = `${d.getDate().toString().padStart(2, '0')} ${monthNames[d.getMonth()]} ${year}`;
      labels.push(label);
      values.push(Math.round(((i + 1) / days) * totalUsers));
    }
  } else if (days <= 366) {
    // Month-by-month
    const months = getMonthsBetween(start, end);
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const year = d.getFullYear();
      labels.push(`${monthNames[d.getMonth()]} ${year}`);
      values.push(Math.round(((i + 1) / months) * totalUsers));
    }
  } else {
    // Year-by-year
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const count = endYear - startYear + 1;
    for (let i = 0; i <= endYear - startYear; i++) {
      labels.push(`${startYear + i}`);
      values.push(Math.round(((i + 1) / count) * totalUsers));
    }
  }

  return { labels, values };
}

const DashboardEvolutionUsers: React.FC = () => {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(monthAgo);
  const [endDate, setEndDate] = useState<Date>(today);
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.users
      .getAll()
      .then(res => { if (!cancelled) setUsers(res || []); })
      .catch(err => { if (!cancelled) setError(String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totalUsers = users ? users.length : 0;

  const { labels, values } = buildLabelsAndValues(startDate, endDate, totalUsers);

  const days = getDaysBetween(startDate, endDate);
  const granularity = days <= 31 ? 'Jour' : days <= 366 ? 'Mois' : 'Année';

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        return `<b>${p.name}</b><br/>${p.value} utilisateurs`;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '14%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        rotate: labels.length > 12 ? 45 : 0,
        fontSize: 11,
        color: '#64748b',
        formatter: (val: string) => val,
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: 'Utilisateurs',
        type: 'bar',
        data: values,
        barMaxWidth: 48,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#a5b4fc' },
          ]),
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4f46e5' },
              { offset: 1, color: '#818cf8' },
            ]),
          },
        },
      },
    ],
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-1">Utilisateurs inscrits</h3>
      <p className="text-sm text-gray-500 mb-4">Nombre d'utilisateurs inscrits dans la base sur la période sélectionnée.</p>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100" style={{ minHeight: 340 }}>
        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Total utilisateurs</div>
            <div className="text-3xl font-bold text-slate-800">{totalUsers}</div>
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
                { label: '7j', fn: () => { const s = new Date(today); s.setDate(today.getDate() - 6); setStartDate(s); setEndDate(today); } },
                { label: '1m', fn: () => { const s = new Date(today); s.setMonth(today.getMonth() - 1); setStartDate(s); setEndDate(today); } },
                { label: '3m', fn: () => { const s = new Date(today); s.setMonth(today.getMonth() - 3); setStartDate(s); setEndDate(today); } },
                { label: '1a', fn: () => { const s = new Date(today); s.setFullYear(today.getFullYear() - 1); setStartDate(s); setEndDate(today); } },
                { label: '3a', fn: () => { const s = new Date(today); s.setFullYear(today.getFullYear() - 3); setStartDate(s); setEndDate(today); } },
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
            <ReactECharts echarts={echarts} option={option} style={{ height: '100%' }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardEvolutionUsers;



