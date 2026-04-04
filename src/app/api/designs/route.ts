import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { DEFAULT_GLOBAL_STYLE } from '@/lib/defaults';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('designs')
    .select('id, name, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, globalStyle, blocks } = body;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('designs')
    .insert({
      name: name || 'Untitled Newsletter',
      global_style: globalStyle ? { ...DEFAULT_GLOBAL_STYLE, ...globalStyle } : DEFAULT_GLOBAL_STYLE,
      blocks: blocks || [],
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Failed to create design' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
