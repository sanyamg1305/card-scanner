import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const envStatus = {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 15) + '...'
      : 'NOT SET',
  };

  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({
      status: 'error',
      connected: false,
      message: 'Supabase client could not be created because environment variables are missing in Vercel.',
      envStatus,
      solution: 'Go to Vercel Project Settings -> Environment Variables, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, and then Redeploy.',
    });
  }

  // Test 1: SELECT from cards table
  let selectResult: any = null;
  let selectError: any = null;
  try {
    const { data, error } = await supabase.from('cards').select('*').limit(3);
    selectResult = data;
    selectError = error ? { message: error.message, code: error.code, details: error.details } : null;
  } catch (err: any) {
    selectError = { message: err.message };
  }

  // Test 2: Test INSERT into cards table with test ID
  const testId = `health_check_${Date.now()}`;
  let insertError: any = null;
  let insertSuccess = false;
  try {
    const { error: insErr } = await supabase.from('cards').insert({
      id: testId,
      name: 'ExpoScan Health Test',
      company: 'Diagnostic Test',
      lead_priority: 'WARM',
      tags: [],
    });
    if (insErr) {
      insertError = { message: insErr.message, code: insErr.code, details: insErr.details };
    } else {
      insertSuccess = true;
      // Clean up test row
      await supabase.from('cards').delete().eq('id', testId);
    }
  } catch (err: any) {
    insertError = { message: err.message };
  }

  return NextResponse.json({
    status: insertSuccess ? 'healthy' : 'issue_detected',
    connected: true,
    envStatus,
    select: {
      success: !selectError,
      count: selectResult ? selectResult.length : 0,
      sample: selectResult ? selectResult.map((c: any) => ({ id: c.id, name: c.name, company: c.company })) : [],
      error: selectError,
    },
    insertTest: {
      success: insertSuccess,
      error: insertError,
    },
    recommendation: insertError
      ? `Supabase insert failed: ${insertError.message}. If this mentions Row Level Security (RLS), run in Supabase SQL Editor: ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY; or CREATE POLICY "Allow all access to cards" ON public.cards FOR ALL USING (true) WITH CHECK (true);`
      : 'Database is working properly!',
  });
}
