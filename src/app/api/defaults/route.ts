import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const VALID_KEYS = ['global_style', 'header', 'content_card', 'footer', 'translations', 'language'];

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_defaults')
    .select('key, value');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const defaults: Record<string, unknown> = {};
  for (const row of data || []) {
    defaults[row.key] = row.value;
  }
  return NextResponse.json(defaults);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { key, value } = body;

  if (!key || !VALID_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('user_defaults')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
