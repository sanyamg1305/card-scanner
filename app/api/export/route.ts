import { NextRequest, NextResponse } from 'next/server';
import { getAllCards } from '@/lib/db';

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exhibition = searchParams.get('exhibition') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const industry = searchParams.get('industry') || undefined;

    const cards = await getAllCards({ exhibition, priority, industry });

    const headers = [
      'ID',
      'Created At',
      'Name',
      'Designation',
      'Department',
      'Company',
      'Tagline',
      'Industry',
      'Role Persona',
      'Company Summary',
      'Primary Phone',
      'Secondary / WhatsApp Phone',
      'Email',
      'Secondary Email',
      'Website',
      'Address',
      'City',
      'Country',
      'LinkedIn',
      'Other Social',
      'Exhibition Name',
      'Booth Number',
      'Lead Priority',
      'Meeting Notes',
      'Action Items',
      'Follow-up Date',
      'Tags',
    ];

    const rows = cards.map((card) => [
      escapeCsv(card.id),
      escapeCsv(card.created_at),
      escapeCsv(card.name),
      escapeCsv(card.designation),
      escapeCsv(card.department),
      escapeCsv(card.company),
      escapeCsv(card.tagline),
      escapeCsv(card.industry),
      escapeCsv(card.role_type),
      escapeCsv(card.company_summary),
      escapeCsv(card.phone),
      escapeCsv(card.phone_secondary),
      escapeCsv(card.email),
      escapeCsv(card.email_secondary),
      escapeCsv(card.website),
      escapeCsv(card.address),
      escapeCsv(card.city),
      escapeCsv(card.country),
      escapeCsv(card.linkedin),
      escapeCsv(card.other_social),
      escapeCsv(card.exhibition_name),
      escapeCsv(card.booth_number),
      escapeCsv(card.lead_priority),
      escapeCsv(card.meeting_notes),
      escapeCsv(card.action_items),
      escapeCsv(card.follow_up_date),
      escapeCsv(card.tags ? card.tags.join(', ') : ''),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `exhibition_leads_${dateStr}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
