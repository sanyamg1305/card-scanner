'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { VisitingCard, LeadPriority } from '@/lib/types';
import LeadPriorityBadge from '@/components/LeadPriorityBadge';
import ContactActionBar from '@/components/ContactActionBar';
import {
  Search,
  Filter,
  Download,
  Camera,
  Flame,
  SunMedium,
  Snowflake,
  Building2,
  Calendar,
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
  Tag,
  Package,
} from 'lucide-react';

function CardsDirectoryContent() {
  const searchParams = useSearchParams();
  const initialPriority = searchParams.get('priority') || 'ALL';
  const initialIndustry = searchParams.get('industry') || 'ALL';

  const [cards, setCards] = useState<VisitingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>(initialPriority);
  const [selectedIndustry, setSelectedIndustry] = useState<string>(initialIndustry);
  const [selectedExhibition, setSelectedExhibition] = useState<string>('ALL');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cards');
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique lists of industries and exhibitions
  const industries = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set).sort();
  }, [cards]);

  const exhibitions = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      if (c.exhibition_name) set.add(c.exhibition_name);
    });
    return Array.from(set).sort();
  }, [cards]);

  // Client-side filtering for instantaneous search UX
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (selectedPriority !== 'ALL' && c.lead_priority !== selectedPriority) {
        return false;
      }
      if (selectedIndustry !== 'ALL' && c.industry !== selectedIndustry) {
        return false;
      }
      if (selectedExhibition !== 'ALL' && c.exhibition_name !== selectedExhibition) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(query) ||
          c.company.toLowerCase().includes(query) ||
          (c.designation && c.designation.toLowerCase().includes(query)) ||
          (c.phone && c.phone.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.meeting_notes && c.meeting_notes.toLowerCase().includes(query)) ||
          (c.action_items && c.action_items.toLowerCase().includes(query)) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(query)));
        if (!matches) return false;
      }
      return true;
    });
  }, [cards, selectedPriority, selectedIndustry, selectedExhibition, search]);

  const priorityCounts = useMemo(() => {
    return {
      ALL: cards.length,
      HOT: cards.filter((c) => c.lead_priority === 'HOT').length,
      WARM: cards.filter((c) => c.lead_priority === 'WARM').length,
      COLD: cards.filter((c) => c.lead_priority === 'COLD').length,
    };
  }, [cards]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Exhibition Leads Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {cards.length} total contacts collected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/export?priority=${selectedPriority}&industry=${selectedIndustry}&exhibition=${selectedExhibition}`}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
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

      {/* Search & Priority Pills */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name, company, notes, phone, tag, or action item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Priority Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'HOT', 'WARM', 'COLD'] as const).map((p) => {
            const isSelected = selectedPriority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPriority(p)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? p === 'HOT'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : p === 'WARM'
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                      : p === 'COLD'
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {p === 'HOT' && <Flame size={13} className={isSelected ? 'text-white' : 'text-red-500'} />}
                {p === 'WARM' && <SunMedium size={13} className={isSelected ? 'text-white' : 'text-amber-500'} />}
                {p === 'COLD' && <Snowflake size={13} className={isSelected ? 'text-white' : 'text-sky-500'} />}
                <span>{p === 'ALL' ? 'All Leads' : `${p} Leads`}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {priorityCounts[p]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary dropdown filters: Industry & Exhibition */}
        {(industries.length > 0 || exhibitions.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {industries.length > 0 && (
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">All Industries</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            )}

            {exhibitions.length > 0 && (
              <select
                value={selectedExhibition}
                onChange={(e) => setSelectedExhibition(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">All Exhibitions</option>
                {exhibitions.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            )}

            {(selectedPriority !== 'ALL' || selectedIndustry !== 'ALL' || selectedExhibition !== 'ALL' || search) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPriority('ALL');
                  setSelectedIndustry('ALL');
                  setSelectedExhibition('ALL');
                  setSearch('');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline px-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading contacts...</div>
      ) : filteredCards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search size={22} />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">No leads match your filter</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Try searching for something else, clearing your filters, or scan a new business card.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedPriority('ALL');
              setSelectedIndustry('ALL');
              setSelectedExhibition('ALL');
              setSearch('');
            }}
            className="inline-block px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Left info */}
                <div className="flex items-start gap-3.5">
                  {card.image_front ? (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                      <img
                        src={card.image_front}
                        alt="Card"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-lg">
                      {card.name ? card.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cards/${card.id}`}
                        className="font-bold text-base sm:text-lg text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {card.name}
                      </Link>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {card.designation && <span>{card.designation} • </span>}
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {card.company || 'Unknown Company'}
                      </span>
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {card.industry && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {card.industry}
                        </span>
                      )}
                      {card.role_type && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium">
                          {card.role_type}
                        </span>
                      )}
                      {card.exhibition_name && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium">
                          {card.exhibition_name}
                        </span>
                      )}
                      {card.product_images && card.product_images.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium flex items-center gap-1">
                          <Package size={11} />
                          {card.product_images.length} {card.product_images.length === 1 ? 'product' : 'products'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right priority badge */}
                <div className="sm:self-start">
                  <LeadPriorityBadge priority={card.lead_priority} size="md" />
                </div>
              </div>

              {/* Discussion Notes Snippet */}
              {card.meeting_notes && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">
                    Meeting Discussion:
                  </span>
                  <p className="line-clamp-2 italic">&quot;{card.meeting_notes}&quot;</p>
                </div>
              )}

              {/* Action items if any */}
              {card.action_items && (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                  <span className="font-bold">Next Action:</span>
                  <span>{card.action_items}</span>
                </div>
              )}

              {/* Footer bar with actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>
                    Scanned{' '}
                    {new Date(card.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <Link
                    href={`/cards/${card.id}`}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <span>View Card Details</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="shrink-0">
                  <ContactActionBar card={card} compact />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CardsDirectoryPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-slate-400">Loading leads...</div>}>
      <CardsDirectoryContent />
    </Suspense>
  );
}
