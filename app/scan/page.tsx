'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VisitingCard, CardScanResult, LeadPriority } from '@/lib/types';
import LeadPriorityBadge from '@/components/LeadPriorityBadge';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Check,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Tag,
  Calendar,
  Layers,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  Download,
  Package,
  Plus,
  X,
  FileText,
} from 'lucide-react';
import { compressImageFile } from '@/lib/imageUtils';
import { CERAMIC_TILE_CATEGORIES } from '@/lib/categories';

export default function ScanPage() {
  const router = useRouter();

  // Images state
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [savedFrontUrl, setSavedFrontUrl] = useState<string>('');
  const [savedBackUrl, setSavedBackUrl] = useState<string>('');

  // Meeting Notes & Exhibition Context
  const [exhibitionName, setExhibitionName] = useState('Expo 2026');
  const [boothNumber, setBoothNumber] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [leadPriority, setLeadPriority] = useState<LeadPriority>('WARM');

  // Scanning & Extracted fields
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('Processing image...');
  const [scanError, setScanError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<CardScanResult | null>(null);

  // Form fields (editable after scan)
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

  // Saved result modal
  const [savedCard, setSavedCard] = useState<VisitingCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load default exhibition name from settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.defaultExhibition) setExhibitionName(data.defaultExhibition);
      })
      .catch(() => {});
  }, []);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 1600, 0.85);
      if (side === 'front') {
        setFrontImage(compressed);
      } else {
        setBackImage(compressed);
      }
    } catch (err) {
      console.error('Image compression error:', err);
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImageFile(file, 1200, 0.80);
        setProductImages((prev) => [...prev, compressed]);
      } catch (err) {
        console.error('Product image compression error:', err);
      }
    }
  };

  const removeProductImage = (indexToRemove: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const runAiAnalysis = async () => {
    if (!frontImage) {
      setScanError('Please take or upload a photo of the card front.');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScanStepMessage('Sending card and product images to Gemini Multimodal AI...');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontImage,
          backImage,
          productImages,
        }),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(
          res.status === 413
            ? 'Images too large for serverless limit (4.5MB). Please retake with a smaller photo.'
            : `Server returned an error (${res.status}): ${responseText.slice(0, 150)}`
        );
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const parsed: CardScanResult = data.data;
      setExtracted(parsed);
      if (data.images?.front) setSavedFrontUrl(data.images.front);
      if (data.images?.back) setSavedBackUrl(data.images.back);

      // Populate form
      setName(parsed.name || '');
      setDesignation(parsed.designation || '');
      setDepartment(parsed.department || '');
      setCompany(parsed.company || '');
      setTagline(parsed.tagline || '');
      setPhone(parsed.phone || '');
      setPhoneSecondary(parsed.phone_secondary || '');
      setEmail(parsed.email || '');
      setEmailSecondary(parsed.email_secondary || '');
      setWebsite(parsed.website || '');
      setAddress(parsed.address || '');
      setCity(parsed.city || '');
      setCountry(parsed.country || '');
      setIndustry(parsed.industry || '');
      setRoleType(parsed.role_type || '');
      setCompanySummary(parsed.company_summary || '');
      setDescription(parsed.description || parsed.company_summary || '');
      const initialCats =
        parsed.categories && parsed.categories.length > 0
          ? parsed.categories
          : parsed.category
          ? [parsed.category]
          : parsed.industry
          ? [parsed.industry]
          : [];
      setCategories(initialCats);
      setTags(parsed.suggested_tags || []);
      if (parsed.suggested_priority) {
        setLeadPriority(parsed.suggested_priority);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(err.message || 'Error occurred while scanning');
    } finally {
      setIsScanning(false);
    }
  };

  const addTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSaveLead = async () => {
    if (!name.trim() && !company.trim()) {
      setScanError('Please ensure at least Name or Company is provided.');
      return;
    }

    setIsSaving(true);
    setScanError(null);
    try {
      const payload: Partial<VisitingCard> = {
        name: name.trim() || 'Contact',
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
        exhibition_name: exhibitionName,
        booth_number: boothNumber,
        meeting_notes: meetingNotes,
        action_items: actionItems,
        lead_priority: leadPriority,
        tags,
        image_front: savedFrontUrl || frontImage || '',
        image_back: savedBackUrl || backImage || '',
        product_images: productImages,
        raw_extracted_json: extracted ? JSON.stringify(extracted) : '',
      };

      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          res.status === 413
            ? 'Lead payload exceeds 4.5MB limit.'
            : `Server response error (${res.status}): ${responseText.slice(0, 120)}`
        );
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to save contact lead (${res.status})`);
      }

      if (data.card) {
        setSavedCard(data.card);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setScanError(err.message || 'Failed to save contact lead');
    } finally {
      setIsSaving(false);
    }
  };

  const resetFormForNextCard = () => {
    setFrontImage(null);
    setBackImage(null);
    setProductImages([]);
    setSavedFrontUrl('');
    setSavedBackUrl('');
    setExtracted(null);
    setName('');
    setDesignation('');
    setDepartment('');
    setCompany('');
    setTagline('');
    setPhone('');
    setPhoneSecondary('');
    setEmail('');
    setEmailSecondary('');
    setWebsite('');
    setAddress('');
    setCity('');
    setCountry('');
    setIndustry('');
    setRoleType('');
    setCompanySummary('');
    setDescription('');
    setCategories([]);
    setCustomCategoryInput('');
    setTags([]);
    setMeetingNotes('');
    setActionItems('');
    setBoothNumber('');
    setSavedCard(null);
    setScanError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Camera size={24} className="text-indigo-600" />
            Scan Visiting Card
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Capture card photo, extract details with AI, and record meeting notes
          </p>
        </div>
      </div>

      {scanError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Notice</p>
            <p>{scanError}</p>
            {scanError.includes('API Key') && (
              <button
                onClick={() => router.push('/settings')}
                className="mt-2 text-xs font-bold underline block"
              >
                Go to Settings to enter Gemini API Key →
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 1: Card Photos & Exhibition Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Layers size={14} />
            Step 1: Card Photos & Event
          </span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Exhibition:</label>
            <input
              type="text"
              value={exhibitionName}
              onChange={(e) => setExhibitionName(e.target.value)}
              className="text-xs px-2.5 py-1 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 max-w-[140px]"
            />
          </div>
        </div>

        {/* Card Photos (Front & Back) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Front */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Card Front <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              ref={frontInputRef}
              accept="image/*"
              capture="environment"
              onChange={(e) => handleImageUpload(e, 'front')}
              className="hidden"
            />
            {frontImage ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-[16/10] flex items-center justify-center">
                <img
                  src={frontImage}
                  alt="Card Front"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold shadow hover:bg-white flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrontImage(null)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => frontInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-6 aspect-[16/10] flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/30 group"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Camera size={22} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tap to Snap / Upload Front
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Camera or Photo Library</span>
              </div>
            )}
          </div>

          {/* Card Back (Optional) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Card Back <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="file"
              ref={backInputRef}
              accept="image/*"
              capture="environment"
              onChange={(e) => handleImageUpload(e, 'back')}
              className="hidden"
            />
            {backImage ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-[16/10] flex items-center justify-center">
                <img
                  src={backImage}
                  alt="Card Back"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => backInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold shadow hover:bg-white flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackImage(null)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => backInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-6 aspect-[16/10] flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/30 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tap to Snap / Upload Back
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Useful for product lists / QR</span>
              </div>
            )}
          </div>
        </div>

        {/* Product & Sample Photos (Optional) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Package size={14} className="text-indigo-600" />
                <span>Product & Sample Photos</span>
                <span className="text-slate-400 font-normal">({productImages.length} attached)</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Snap photos of booth products, samples, or catalog pages
              </p>
            </div>
            <button
              type="button"
              onClick={() => productInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus size={13} />
              <span>Add Product</span>
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
              {productImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-950 flex items-center justify-center shadow-sm"
                >
                  <img
                    src={img}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeProductImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    title="Remove product photo"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => productInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 aspect-square transition-colors p-2 text-center bg-slate-50/50 hover:bg-indigo-50/30"
              >
                <Plus size={20} />
                <span className="text-[10px] font-semibold mt-1">Add More</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => productInputRef.current?.click()}
              className="border border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-xl p-3.5 flex items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-colors"
            >
              <Package size={16} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Tap to snap or attach product/sample photos (optional)
              </span>
            </div>
          )}
        </div>

        {/* Meeting Notes (Right as you meet them!) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Booth Discussion Notes</span>
              <span className="text-slate-400 font-normal">(Voice / text note)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Lead Rating:</span>
              <LeadPriorityBadge
                priority={leadPriority}
                interactive
                onChange={setLeadPriority}
              />
            </div>
          </div>
          <textarea
            rows={2}
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            placeholder="e.g. Discussed bulk supply of 5000 units. Very interested in our eco packaging line. Mentioned booth 14."
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Scan Button CTA */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={runAiAnalysis}
            disabled={!frontImage || isScanning}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-bold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.99]"
          >
            {isScanning ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                <span>{scanStepMessage}</span>
              </>
            ) : (
              <>
                <Sparkles size={17} />
                <span>Extract with Gemini AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STEP 2: Review & Edit Extracted Information */}
      {extracted && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500" />
              Step 2: AI Extracted Details (Editable)
            </span>
            <span className="text-xs text-slate-400">Review before saving</span>
          </div>

          {/* AI Insights Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <Building2 size={13} />
                  AI Classification:
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {industry || 'General Business'}
                </span>
                {roleType && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {roleType}
                  </span>
                )}
              </div>
              <LeadPriorityBadge priority={leadPriority} size="sm" />
            </div>
            {companySummary && (
              <p className="text-xs text-indigo-950 dark:text-indigo-200/90 leading-relaxed font-medium">
                💡 <span className="font-semibold">Company Summary:</span> {companySummary}
              </p>
            )}
          </div>

          {/* Personal Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Designation / Title</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Company Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full text-sm font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Industry / Domain</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Ceramic Tile Exhibition Categories */}
          <div className="space-y-3.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="text-indigo-600 dark:text-indigo-400" size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Ceramic Tile Categories
                </h3>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {categories.length} Selected
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select tile finishes, products, or trade role for this lead:
            </p>

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
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600 dark:text-indigo-400" size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Lead & Product Description
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Exhibition Details</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Product specifications, tile sizes, inquiry details, or booth conversation notes:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Morbi-based manufacturer specializing in 600x1200mm GVT and high gloss porcelain slabs. Looking for domestic distributors in North India. Minimum order 2 containers."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
            />

            {/* Quick Prompt Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick Exhibition Snippets (Tap to add):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Inquiring for 600x1200 GVT Tiles',
                  'Looking for 800x1600 & Slab distributor',
                  'Inquiring for Handmade & Subway tiles',
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

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Primary Phone / Mobile</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Secondary / WhatsApp Phone</label>
                <input
                  type="text"
                  value={phoneSecondary}
                  onChange={(e) => setPhoneSecondary(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Full Address / Location</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Action items & Follow-up */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Action Items & Follow-up
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Agreed Action Items</label>
                <input
                  type="text"
                  placeholder="e.g. Send wholesale price list by Friday"
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Booth / Hall Number</label>
                <input
                  type="text"
                  placeholder="e.g. Hall 2, Booth A-15"
                  value={boothNumber}
                  onChange={(e) => setBoothNumber(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Tags / Keywords
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
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

          {/* Save Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {scanError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-2.5 text-xs animate-in fade-in">
                <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-600" />
                <div className="space-y-1">
                  <p className="font-bold text-red-800 dark:text-red-200">Unable to Save Lead</p>
                  <p>{scanError}</p>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveLead}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99]"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    <span>Saving Lead...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Save Lead to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal upon Saving */}
      {savedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Check size={28} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Lead Saved Successfully!
              </h3>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                {savedCard.name}
              </p>
              <p className="text-xs text-slate-500">
                {savedCard.company} • {savedCard.exhibition_name}
              </p>
            </div>

            {/* Instant Actions */}
            <div className="space-y-2 text-left bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Quick Exhibition Actions:
              </span>

              {/* Download vCard */}
              <a
                href={`/api/vcard/${savedCard.id}`}
                download
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Download size={15} />
                  Save to Phone Contacts (.vcf)
                </span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">1-Tap</span>
              </a>

              {/* WhatsApp */}
              {savedCard.phone && (
                <a
                  href={`https://wa.me/${savedCard.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hi ${savedCard.name}, it was great meeting you today at ${savedCard.exhibition_name || 'the exhibition'}!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={15} />
                    Send WhatsApp Greeting
                  </span>
                  <ArrowRight size={13} />
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={resetFormForNextCard}
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Scan Next Card
              </button>
              <button
                type="button"
                onClick={() => router.push(`/cards/${savedCard.id}`)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                View Full Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
