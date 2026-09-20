'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VisitingCard, LeadPriority } from '@/lib/types';
import LeadPriorityBadge from '@/components/LeadPriorityBadge';
import ContactActionBar from '@/components/ContactActionBar';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Save,
  Trash2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Download,
  Clock,
  Layers,
  Check,
} from 'lucide-react';

export default function CardDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [card, setCard] = useState<VisitingCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable form fields
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [company, setCompany] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [email, setEmail] = useState('');
  const [emailSecondary, setEmailSecondary] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [roleType, setRoleType] = useState('');
  const [companySummary, setCompanySummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const [exhibitionName, setExhibitionName] = useState('');
  const [boothNumber, setBoothNumber] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [leadPriority, setLeadPriority] = useState<LeadPriority>('WARM');

  useEffect(() => {
    async function loadCard() {
      try {
        const res = await fetch(`/api/cards/${params.id}`);
        const data = await res.json();
        if (data.card) {
          const c: VisitingCard = data.card;
          setCard(c);
          setName(c.name || '');
          setDesignation(c.designation || '');
          setDepartment(c.department || '');
          setCompany(c.company || '');
          setTagline(c.tagline || '');
          setPhone(c.phone || '');
          setPhoneSecondary(c.phone_secondary || '');
          setEmail(c.email || '');
          setEmailSecondary(c.email_secondary || '');
          setWebsite(c.website || '');
          setAddress(c.address || '');
          setCity(c.city || '');
          setCountry(c.country || '');
          setIndustry(c.industry || '');
          setRoleType(c.role_type || '');
          setCompanySummary(c.company_summary || '');
          setTags(c.tags || []);
          setExhibitionName(c.exhibition_name || '');
          setBoothNumber(c.booth_number || '');
          setMeetingNotes(c.meeting_notes || '');
          setActionItems(c.action_items || '');
          setFollowUpDate(c.follow_up_date || '');
          setLeadPriority(c.lead_priority || 'WARM');
        } else {
          setError('Card not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load card');
      } finally {
        setLoading(false);
      }
    }
    loadCard();
  }, [params.id]);

  const handleSaveChanges = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const payload: Partial<VisitingCard> = {
        name,
        designation,
        department,
        company,
        tagline,
        phone,
        phone_secondary: phoneSecondary,
        email,
        email_secondary: emailSecondary,
        website,
        address,
        city,
        country,
        industry,
        role_type: roleType,
        company_summary: companySummary,
        tags,
        exhibition_name: exhibitionName,
        booth_number: boothNumber,
        meeting_notes: meetingNotes,
        action_items: actionItems,
        follow_up_date: followUpDate,
        lead_priority: leadPriority,
      };

      const res = await fetch(`/api/cards/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.card) {
        setCard(data.card);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err: any) {
      alert('Failed to save changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!confirm('Are you sure you want to delete this visiting card?')) return;
    try {
      await fetch(`/api/cards/${params.id}`, { method: 'DELETE' });
      router.push('/cards');
    } catch (err) {
      alert('Failed to delete card');
    }
  };

  const addTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400">Loading contact details...</div>;
  }

  if (error || !card) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-red-500 font-semibold">{error || 'Card not found'}</p>
        <Link
          href="/cards"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
        >
          <ArrowLeft size={16} /> Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Nav & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/cards"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Leads</span>
        </Link>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
              <Check size={14} /> Saved!
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Card Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{name}</h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">
              {designation ? `${designation} • ` : ''}
              <span className="font-bold text-slate-900 dark:text-slate-100">{company}</span>
            </p>
            {tagline && <p className="text-xs text-slate-400 italic mt-0.5">&quot;{tagline}&quot;</p>}
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <LeadPriorityBadge
              priority={leadPriority}
              interactive
              onChange={setLeadPriority}
            />
            {exhibitionName && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200/60 dark:border-emerald-900">
                {exhibitionName} {boothNumber ? `(${boothNumber})` : ''}
              </span>
            )}
          </div>
        </div>

        {/* 1-Click Action Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <ContactActionBar card={card} />
        </div>
      </div>

      {/* Card Photos Section (if any were captured) */}
      {(card.image_front || card.image_back) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers size={14} />
            Original Visiting Card Photo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {card.image_front && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Front</span>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-[16/10] flex items-center justify-center">
                  <img
                    src={card.image_front}
                    alt="Card Front"
                    className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(card.image_front, '_blank')}
                  />
                </div>
              </div>
            )}
            {card.image_back && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Back</span>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-[16/10] flex items-center justify-center">
                  <img
                    src={card.image_back}
                    alt="Card Back"
                    className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(card.image_back, '_blank')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meeting Notes & Action Items (Exhibition CRM) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Clock size={14} />
            Exhibition Meeting Notes & Follow-up
          </h2>
          <span className="text-xs text-slate-400">Recorded at exhibition</span>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
            Discussion & Meeting Notes
          </label>
          <textarea
            rows={4}
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            placeholder="Record what you discussed with them at your booth, their requirements, budget, timeline..."
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Agreed Next Action Items
            </label>
            <input
              type="text"
              placeholder="e.g. Send samples by Oct 15"
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Follow-up Due Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Exhibition Name
            </label>
            <input
              type="text"
              value={exhibitionName}
              onChange={(e) => setExhibitionName(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Booth / Hall Number
            </label>
            <input
              type="text"
              value={boothNumber}
              onChange={(e) => setBoothNumber(e.target.value)}
              placeholder="e.g. Hall 4, Stall 12"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* AI Intelligence & Classification */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Sparkles size={14} />
            AI Categorization & Insights
          </h2>
          <span className="text-xs text-slate-400">Auto-extracted by Gemini</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Industry / Domain</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Role Persona</label>
            <input
              type="text"
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              placeholder="e.g. Decision Maker, Buyer, Supplier"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Company Summary (AI)</label>
          <textarea
            rows={2}
            value={companySummary}
            onChange={(e) => setCompanySummary(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs text-slate-500 block mb-1.5">Tags & Keywords</label>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="hover:text-red-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Add tag..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-1"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Contact Fields */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
          Contact & Company Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Designation / Title</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Company Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Primary Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Secondary / WhatsApp Phone</label>
            <input
              type="text"
              value={phoneSecondary}
              onChange={(e) => setPhoneSecondary(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Website</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Street Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions: Save and Delete */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleDeleteCard}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
        >
          <Trash2 size={15} />
          <span>Delete Card</span>
        </button>

        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>
    </div>
  );
}
