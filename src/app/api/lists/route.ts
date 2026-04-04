import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabase();

  const { data: lists, error } = await supabase
    .from('email_lists')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get subscriber counts
  const listsWithCounts = await Promise.all(
    (lists || []).map(async (list) => {
      const { count } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id);

      return {
        id: list.id,
        name: list.name,
        createdAt: list.created_at,
        subscriberCount: count || 0,
      };
    })
  );

  return NextResponse.json(listsWithCounts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('email_lists')
    .insert({ name })
    .select('id, name, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
    subscriberCount: 0,
  }, { status: 201 });
}
