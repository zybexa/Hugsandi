import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const ALLOWED_ORIGINS = [
  'https://hugsandi.is',
  'https://www.hugsandi.is',
];

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  const body = await request.json();
  const { email, name } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400, headers });
  }

  const supabase = getSupabase();

  // Get the first list (default newsletter list)
  const { data: list, error: listError } = await supabase
    .from('email_lists')
    .select('id')
    .limit(1)
    .single();

  if (listError || !list) {
    return NextResponse.json({ error: 'No list configured' }, { status: 500, headers });
  }

  const { error } = await supabase
    .from('subscribers')
    .insert({ list_id: list.id, email, name: name || null });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409, headers });
    }
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500, headers });
  }

  return NextResponse.json({ success: true }, { status: 201, headers });
}
