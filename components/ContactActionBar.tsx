import React, { useState } from 'react';
import { VisitingCard } from '@/lib/types';
import { Phone, Mail, MessageSquare, Download, Sparkles, Copy, Check, ExternalLink } from 'lucide-react';

interface Props {
  card: VisitingCard;
  onGenerateEmail?: () => void;
  compact?: boolean;
}

export default function ContactActionBar({ card, compact = false }: Props) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [instructions, setInstructions] = useState('');

  // Clean phone number for WhatsApp (needs international format without symbols)
  const rawPhone = card.phone || card.phone_secondary || '';
  const digitsOnly = rawPhone.replace(/\D/g, '');
  
  // Create WhatsApp pre-filled text
  const exhibitionText = card.exhibition_name ? ` at ${card.exhibition_name}` : '';
  const greeting = `Hi ${card.name || 'there'}, it was a pleasure meeting you${exhibitionText}! Let's connect soon regarding our discussion.`;
  const whatsappUrl = digitsOnly
    ? `https://wa.me/${digitsOnly}?text=${encodeURIComponent(greeting)}`
    : null;

  const handleDraftEmail = async () => {
    setShowEmailModal(true);
    if (!emailBody) {
      setGenerating(true);
      try {
        const res = await fetch('/api/followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId: card.id,
            instructions: instructions || 'Professional follow-up mentioning our discussion',
          }),
        });
        const data = await res.json();
        if (data.draft) {
          setEmailSubject(data.draft.subject || `Great meeting you at ${card.exhibition_name || 'the expo'}`);
          setEmailBody(data.draft.body || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setGenerating(false);
      }
    }
  };

  const copyDraft = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInMailClient = () => {
    const mailto = `mailto:${card.email || ''}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto, '_blank');
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp"
            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <MessageSquare size={16} />
          </a>
        )}
        {card.phone && (
          <a
            href={`tel:${card.phone}`}
            title="Call"
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Phone size={16} />
          </a>
        )}
        {card.email && (
          <a
            href={`mailto:${card.email}`}
            title="Email"
            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <Mail size={16} />
          </a>
        )}
        <a
          href={`/api/vcard/${card.id}`}
          download
          title="Save Contact to Phone (.vcf)"
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          <Download size={16} />
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* WhatsApp Button */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            <MessageSquare size={17} />
            <span>WhatsApp</span>
          </a>
        ) : (
          <button
            disabled
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-medium text-sm cursor-not-allowed opacity-60"
          >
            <MessageSquare size={17} />
            <span>WhatsApp</span>
          </button>
        )}

        {/* Add to Phone Contacts (.vcf) */}
        <a
          href={`/api/vcard/${card.id}`}
          download
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm transition-all active:scale-[0.98]"
        >
          <Download size={17} />
          <span>Save Contact</span>
        </a>

        {/* Call */}
        {card.phone ? (
          <a
            href={`tel:${card.phone}`}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-medium text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            <Phone size={17} />
            <span>Call</span>
          </a>
        ) : (
          <button
            disabled
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-medium text-sm cursor-not-allowed opacity-60"
          >
            <Phone size={17} />
            <span>Call</span>
          </button>
        )}

        {/* AI Follow-up Draft */}
        <button
          type="button"
          onClick={handleDraftEmail}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-medium text-sm shadow-sm transition-all active:scale-[0.98]"
        >
          <Sparkles size={17} />
          <span>AI Follow-up</span>
        </button>
      </div>

      {/* AI Follow-up Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                    AI Follow-up Email Draft
                  </h3>
                  <p className="text-xs text-slate-500">Tailored to your meeting notes with {card.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1">
              {generating ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Synthesizing card details and meeting notes...</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full text-sm font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                      Body
                    </label>
                    <textarea
                      rows={9}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full text-sm font-normal px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-sans"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="text-xs font-medium text-slate-500 block mb-1">
                      Refine tone or instructions (optional):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. mention our 10% exhibition discount..."
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={handleDraftEmail}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={copyDraft}
                disabled={generating || !emailBody}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={openInMailClient}
                disabled={generating || !emailBody}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              >
                <ExternalLink size={16} />
                <span>Open in Mail App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
