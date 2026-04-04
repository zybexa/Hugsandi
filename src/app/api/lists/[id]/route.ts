import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase();

  const { data: list, error: listError } = await supabase
    .from('email_lists')
    .select('*')
    .eq('id', params.id)
    .single();

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 404 });
  }

  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }

  const { data: subscribers, error: subError } = await supabase
    .from('subscribers')
    .select('id, email, name, created_at')
    .eq('list_id', params.id)
    .order('created_at', { ascending: false });

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: list.id,
    name: list.name,
    createdAt: list.created_at,
    subscribers: (subscribers || []).map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      createdAt: s.created_at,
    })),
  });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { name } = body;

  const supabase = getSupabase();
  const { error } = await supabase
    .from('email_lists')
    .update({ name })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { error } = await supabase.from('email_lists').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
