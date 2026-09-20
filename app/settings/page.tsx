'use client';

import React, { useEffect, useState } from 'react';
import {
  Key,
  Calendar,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Download,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

export default function SettingsPage() {
  const [defaultExhibition, setDefaultExhibition] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.defaultExhibition) setDefaultExhibition(data.defaultExhibition);
      setHasApiKey(data.hasApiKey);
      if (data.maskedKey) setMaskedKey(data.maskedKey);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultExhibition,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setApiKey('');
        await fetchSettings();
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Scanner Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure exhibition presets and Google Gemini AI API credentials
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Exhibition Preset */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Default Exhibition Name
              </h2>
              <p className="text-xs text-slate-400">
                Automatically tags every card scanned during this event
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Active Trade Show / Event
            </label>
            <input
              type="text"
              placeholder="e.g. PlastIndia 2026, AutoExpo 2026, GITEX Dubai"
              value={defaultExhibition}
              onChange={(e) => setDefaultExhibition(e.target.value)}
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              All new scanned cards will automatically have this exhibition name attached.
            </p>
          </div>
        </div>

        {/* Gemini AI Key */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Google Gemini AI Key
                </h2>
                <p className="text-xs text-slate-400">Powers multimodal OCR & business classification</p>
              </div>
            </div>

            {hasApiKey ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-900">
                <ShieldCheck size={13} />
                API Key Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-900">
                <AlertCircle size={13} />
                Key Missing
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                API Key
              </label>
              {maskedKey && (
                <span className="text-xs text-slate-400 font-mono">Current: {maskedKey}</span>
              )}
            </div>

            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder={hasApiKey ? 'Enter new key to update...' : 'AIzaSy...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full text-sm font-mono px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              How to get a free Gemini API Key:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              <li>Visit Google AI Studio</li>
              <li>Sign in with your Google account</li>
              <li>Click &quot;Get API key&quot; and create a key</li>
              <li>Paste it here and click Save</li>
            </ol>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
            >
              <span>Get Free Gemini Key on Google AI Studio</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Save button & status */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
              <Check size={16} /> Settings saved successfully!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
