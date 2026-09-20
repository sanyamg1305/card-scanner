import { VisitingCard } from './types';

export function generateVCard(card: VisitingCard): string {
  // Split name into first and last if possible
  const nameParts = (card.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
    `FN:${escapeVCard(card.name || 'Contact')}`,
  ];

  if (card.company) {
    lines.push(`ORG:${escapeVCard(card.company)}`);
  }

  if (card.designation) {
    lines.push(`TITLE:${escapeVCard(card.designation)}`);
  }

  if (card.phone) {
    lines.push(`TEL;TYPE=CELL,VOICE:${cleanPhone(card.phone)}`);
  }

  if (card.phone_secondary) {
    lines.push(`TEL;TYPE=WORK,VOICE:${cleanPhone(card.phone_secondary)}`);
  }

  if (card.email) {
    lines.push(`EMAIL;TYPE=WORK,INTERNET:${card.email.trim()}`);
  }

  if (card.email_secondary) {
    lines.push(`EMAIL;TYPE=HOME,INTERNET:${card.email_secondary.trim()}`);
  }

  if (card.website) {
    let url = card.website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    lines.push(`URL:${url}`);
  }

  if (card.address || card.city || card.country) {
    lines.push(
      `ADR;TYPE=WORK:;;${escapeVCard(card.address || '')};${escapeVCard(card.city || '')};;;${escapeVCard(card.country || '')}`
    );
  }

  // Combine notes, exhibition, tags, priority into the vCard NOTE field
  const noteParts: string[] = [];
  if (card.exhibition_name) {
    noteParts.push(`[Met at: ${card.exhibition_name}${card.booth_number ? ` | Booth: ${card.booth_number}` : ''}]`);
  }
  if (card.lead_priority) {
    noteParts.push(`[Lead Priority: ${card.lead_priority}]`);
  }
  if (card.industry) {
    noteParts.push(`[Industry: ${card.industry}]`);
  }
  if (card.meeting_notes) {
    noteParts.push(`Notes: ${card.meeting_notes}`);
  }
  if (card.action_items) {
    noteParts.push(`Action Items: ${card.action_items}`);
  }
  if (card.tags && card.tags.length > 0) {
    noteParts.push(`Tags: ${card.tags.join(', ')}`);
  }

  if (noteParts.length > 0) {
    lines.push(`NOTE:${escapeVCard(noteParts.join('\\n'))}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function escapeVCard(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function cleanPhone(phone: string): string {
  return phone.trim().replace(/\s+/g, ' ');
}
