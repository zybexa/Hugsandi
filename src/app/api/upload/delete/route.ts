import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  const path = url.split('/newsletter-images/').pop();
  if (!path) {
    return NextResponse.json({ error: 'Invalid storage URL' }, { status: 400 });
  }

  const supabase = getSupabase();
  await supabase.storage.from('newsletter-images').remove([path]);

  return NextResponse.json({ success: true });
}
