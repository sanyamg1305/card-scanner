'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { VisitingCard } from '@/lib/types';
import LeadPriorityBadge from '@/components/LeadPriorityBadge';
import ContactActionBar from '@/components/ContactActionBar';
import {
  Camera,
  Download,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  Flame,
  SunMedium,
  Snowflake,
  Search,
  Tag,
  MapPin,
} from 'lucide-react';

export default function DashboardPage() {
  const [cards, setCards] = useState<VisitingCard[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    hot: number;
    warm: number;
    cold: number;
    industries: { industry: string; count: number }[];
    exhibitions: { exhibition_name: string; count: number }[];
  }>({
    total: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    industries: [],
    exhibitions: [],
  });
  const [loading, setLoading] = useState(true);
  const [defaultExhibition, setDefaultExhibition] = useState('Expo 2026');

  useEffect(() => {
    async function loadData() {
      try {
        const [cardsRes, statsRes, settingsRes] = await Promise.all([
          fetch('/api/cards'),
          fetch('/api/cards?stats=true'),
          fetch('/api/settings'),
        ]);

        const cardsData = await cardsRes.json();
        const statsData = await statsRes.json();
        const settingsData = await settingsRes.json();

        if (cardsData.cards) setCards(cardsData.cards.slice(0, 6)); // recent 6
        if (statsData.stats) setStats(statsData.stats);
        if (settingsData.defaultExhibition) setDefaultExhibition(settingsData.defaultExhibition);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Exhibition Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Active Exhibition
            </span>
            <Link
              href="/settings"
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
            >
              Change
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {defaultExhibition}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </a>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/25 transition-all active:scale-[0.98]"
          >
            <Camera size={16} />
            <span>Scan Card</span>
          </Link>
        </div>
      </div>

      {/* Hero Quick-Scan Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 text-white p-6 sm:p-7 shadow-lg shadow-indigo-500/10">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide backdrop-blur-sm">
            <Sparkles size={13} />
            <span>AI Multimodal Vision</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Collect leads in 5 seconds. Never lose an exhibition contact.
          </h2>
          <p className="text-indigo-100 text-sm leading-relaxed">
            Snap the business card, let Gemini extract every detail, jot down quick discussion notes, and immediately ping them on WhatsApp or save directly to your phone contacts.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-md transition-transform active:scale-95"
            >
              <Camera size={18} />
              <span>Start Scanning</span>
            </Link>
            <Link
              href="/cards"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
            >
              <span>View All Leads</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/cards"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Scanned</span>
            <Users size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Contacts in database</span>
        </Link>

        <Link
          href="/cards?priority=HOT"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900/60 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Hot Leads</span>
            <Flame size={18} className="text-red-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2">
            {stats.hot}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">High priority follow-ups</span>
        </Link>

        <Link
          href="/cards?priority=WARM"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-900/60 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Warm Leads</span>
            <SunMedium size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {stats.warm}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Good potential</span>
        </Link>

        <Link
          href="/cards?priority=COLD"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-900/60 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Cold Leads</span>
            <Snowflake size={18} className="text-sky-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400 mt-2">
            {stats.cold}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">General info / future</span>
        </Link>
      </div>

      {/* Industries Pills */}
      {stats.industries.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 size={14} />
              Industries Represented
            </h3>
            <span className="text-xs text-slate-400">{stats.industries.length} domains</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.industries.map((ind) => (
              <Link
                key={ind.industry}
                href={`/cards?industry=${encodeURIComponent(ind.industry)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span>{ind.industry}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold">
                  {ind.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Scans Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            Recent Exhibition Leads
          </h2>
          <Link
            href="/cards"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View all ({stats.total})</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading leads...</div>
        ) : cards.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto">
              <Camera size={24} />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">No cards scanned yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Snap your first visiting card to automatically extract contacts, add notes, and save phone contacts.
            </p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm"
            >
              <Camera size={16} />
              <span>Scan First Card</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <Link
                        href={`/cards/${card.id}`}
                        className="font-bold text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block"
                      >
                        {card.name}
                      </Link>
                      <p className="text-xs font-medium text-slate-500">
                        {card.designation ? `${card.designation} • ` : ''}
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                          {card.company || 'Unknown Company'}
                        </span>
                      </p>
                    </div>
                    <LeadPriorityBadge priority={card.lead_priority} size="sm" />
                  </div>

                  {card.industry && (
                    <div className="flex flex-wrap gap-1.5 my-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {card.industry}
                      </span>
                      {card.role_type && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          {card.role_type}
                        </span>
                      )}
                    </div>
                  )}

                  {card.meeting_notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-2 my-2 italic">
                      &quot;{card.meeting_notes}&quot;
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {new Date(card.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <ContactActionBar card={card} compact />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
