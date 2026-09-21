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
  Package,
  Plus,
  X,
  FileText,
} from 'lucide-react';
import { useRef } from 'react';
import { compressImageFile } from '@/lib/imageUtils';
import { CERAMIC_TILE_CATEGORIES } from '@/lib/categories';

export default function CardDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [card, setCard] = useState<VisitingCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

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
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const addCustomCategory = () => {
    if (customCategoryInput.trim() && !categories.includes(customCategoryInput.trim())) {
      setCategories([...categories, customCategoryInput.trim()]);
      setCustomCategoryInput('');
    }
  };

  const appendToDescription = (text: string) => {
    setDescription((prev) => (prev ? `${prev}\n• ${text}` : `• ${text}`));
  };

  const [exhibitionName, setExhibitionName] = useState('');
  const [boothNumber, setBoothNumber] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [leadPriority, setLeadPriority] = useState<LeadPriority>('WARM');

  useEffect(() => {
    async function loadCard() {
      try {
        const res = await fetch(`/api/cards/${params.id}?_t=${Date.now()}`, { cache: 'no-store' });
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
          setDescription(c.description || c.company_summary || '');
          const initialCats =
            c.categories && c.categories.length > 0
              ? c.categories
              : c.category
              ? [c.category]
              : c.industry
              ? [c.industry]
              : [];
          setCategories(initialCats);
          setTags(c.tags || []);
          setProductImages(c.product_images || []);
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

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImageFile(file, 1200, 0.80);
        setProductImages((prev) => [...prev, compressed]);
      } catch (err) {
        console.error('Compression error:', err);
      }
    }
  };

  const removeProductImage = (idxToRemove: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== idxToRemove));
  };

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
        industry: categories[0] || industry,
        category: categories[0] || industry || '',
        categories,
        description,
        role_type: roleType,
        company_summary: description || companySummary,
        tags,
        product_images: productImages,
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

        {/* Active Ceramic Categories Badges */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

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

      {/* Product & Sample Photos Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Package size={14} />
              Product & Sample Photos
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Photos of products or samples taken at the booth ({productImages.length} photos)
            </p>
          </div>
          <button
            type="button"
            onClick={() => productInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
          >
            <Plus size={13} />
            <span>Add Photo</span>
          </button>
        </div>

        <input
          type="file"
          ref={productInputRef}
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleProductImageUpload}
          className="hidden"
        />

        {productImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {productImages.map((img, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-950 flex items-center justify-center shadow-sm"
              >
                <img
                  src={img}
                  alt={`Product ${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => window.open(img, '_blank')}
                />
                <button
                  type="button"
                  onClick={() => removeProductImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  title="Remove photo"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => productInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 aspect-square transition-colors p-3 text-center bg-slate-50/50 hover:bg-indigo-50/30"
            >
              <Plus size={22} />
              <span className="text-xs font-semibold mt-1">Add Photo</span>
            </button>
          </div>
        ) : (
          <div
            onClick={() => productInputRef.current?.click()}
            className="border border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-colors text-center"
          >
            <Package size={20} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No product photos attached yet
            </span>
            <span className="text-[11px] text-slate-400">
              Tap to take or upload photos of products or samples from this contact
            </span>
          </div>
        )}
      </div>

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

        {/* Ceramic Tile Categories */}
        <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="text-indigo-600 dark:text-indigo-400" size={15} />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Ceramic Tile Categories
              </label>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {categories.length} Selected
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {CERAMIC_TILE_CATEGORIES.map((group) => (
              <div key={group.groupName} className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {group.groupName}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.categories.map((cat) => {
                    const isSelected = categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900 font-semibold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Category Input */}
          <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <input
              type="text"
              placeholder="Add other category (e.g. 1200x2400 Slabs, Step Riser)..."
              value={customCategoryInput}
              onChange={(e) => setCustomCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomCategory();
                }
              }}
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={addCustomCategory}
              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <Plus size={13} /> Add
            </button>
          </div>
        </div>

        {/* Lead & Product Description Section */}
        <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-indigo-600 dark:text-indigo-400" size={15} />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Lead & Product Description
              </label>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Exhibition Specs</span>
          </div>

          <textarea
            rows={3}
            placeholder="Product specifications, tile sizes, inquiry details, or booth conversation notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
          />

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Exhibition Snippets (Tap to add):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Inquiring for 600x1200 GVT Tiles',
                'Looking for 800x1600 & Slab distributor',
                'Tile Exporter looking for OEM factory',
                'Large project contractor requirement',
                'Requested catalog & wholesale price list',
                'Samples provided at booth',
              ].map((snippet) => (
                <button
                  key={snippet}
                  type="button"
                  onClick={() => appendToDescription(snippet)}
                  className="text-[11px] px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  + {snippet}
                </button>
              ))}
            </div>
          </div>
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
