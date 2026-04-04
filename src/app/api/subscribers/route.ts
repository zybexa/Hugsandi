import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const body = await request.json();
  const { listId, email, name } = body;

  if (!listId || !email) {
    return NextResponse.json({ error: 'listId and email are required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('subscribers')
    .insert({ list_id: listId, email, name: name || null })
    .select('id, email, name, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This email is already in the list' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: data.created_at,
  }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, email, name } = body;

  if (!id || !email) {
    return NextResponse.json({ error: 'id and email are required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('subscribers')
    .update({ email, name: name || null })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This email is already in the list' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('subscribers').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
