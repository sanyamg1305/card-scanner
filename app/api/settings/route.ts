import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db';

export async function GET() {
  try {
    const defaultExhibition = await getSetting('default_exhibition_name', 'Expo 2026');
    const storedApiKey = await getSetting('gemini_api_key', '');
    const hasApiKey = Boolean(
      process.env.GEMINI_API_KEY || (storedApiKey && storedApiKey.length > 5)
    );
    const maskedKey = storedApiKey
      ? `${storedApiKey.substring(0, 4)}...${storedApiKey.substring(storedApiKey.length - 4)}`
      : process.env.GEMINI_API_KEY
      ? 'Environment Variable Active'
      : '';

    const isSupabaseConfigured = Boolean(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY)
    );

    return NextResponse.json({
      defaultExhibition,
      hasApiKey,
      maskedKey,
      isSupabaseConfigured,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { defaultExhibition, apiKey } = await req.json();

    if (defaultExhibition !== undefined) {
      await setSetting('default_exhibition_name', defaultExhibition.trim());
    }

    if (apiKey !== undefined && apiKey.trim()) {
      await setSetting('gemini_api_key', apiKey.trim());
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
