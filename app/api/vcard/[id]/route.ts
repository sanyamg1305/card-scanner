import { NextRequest, NextResponse } from 'next/server';
import { getCardById } from '@/lib/db';
import { generateVCard } from '@/lib/vcard';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const card = await getCardById(params.id);
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const vcardString = generateVCard(card);
    const safeName = (card.name || 'contact').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}.vcf`;

    return new NextResponse(vcardString, {
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
