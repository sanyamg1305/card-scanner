import { NextRequest, NextResponse } from 'next/server';
import { getAllCards, createCard, getDashboardStats } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const getStats = searchParams.get('stats') === 'true';

    if (getStats) {
      const stats = await getDashboardStats();
      return NextResponse.json({ stats });
    }

    const search = searchParams.get('search') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const industry = searchParams.get('industry') || undefined;
    const exhibition = searchParams.get('exhibition') || undefined;

    const cards = await getAllCards({ search, priority, industry, exhibition });
    return NextResponse.json({ cards });
  } catch (error: any) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: error.message || 'Error fetching cards' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newCard = await createCard(data);
    return NextResponse.json({ card: newCard }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: error.message || 'Error creating card' }, { status: 500 });
  }
}
