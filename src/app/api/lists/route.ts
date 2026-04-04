import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabase();

  const [listsResult, countsResult] = await Promise.all([
    supabase
      .from('email_lists')
      .select('id, name, created_at')
      .order('created_at', { ascending: false }),
    supabase.rpc('get_subscriber_counts'),
  ]);

  const { data: lists, error } = listsResult;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const countMap = new Map<string, number>();
  if (countsResult.data) {
    for (const row of countsResult.data) {
      countMap.set(row.list_id, row.count);
    }
  }

  const listsWithCounts = (lists || []).map((list) => ({
    id: list.id,
    name: list.name,
    createdAt: list.created_at,
    subscriberCount: countMap.get(list.id) || 0,
  }));

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
