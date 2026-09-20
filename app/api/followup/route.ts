import { NextRequest, NextResponse } from 'next/server';
import { getCardById } from '@/lib/db';
import { generateFollowupEmailDraft } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { cardId, instructions, apiKey } = await req.json();

    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    const card = await getCardById(cardId);
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const draft = await generateFollowupEmailDraft(card, instructions, apiKey);
    return NextResponse.json({ draft });
  } catch (error: any) {
    console.error('Followup generator error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate follow-up email' },
      { status: 500 }
    );
  }
}
