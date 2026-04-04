import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseCsv } from '@/lib/csv-parser';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const listId = formData.get('listId') as string;

  if (!file || !listId) {
    return NextResponse.json({ error: 'file and listId are required' }, { status: 400 });
  }

  const csvText = await file.text();
  const subscribers = parseCsv(csvText);

  if (subscribers.length === 0) {
    return NextResponse.json({ error: 'No valid email addresses found in CSV' }, { status: 400 });
  }

  const supabase = getSupabase();
  const rows = subscribers.map((s) => ({
    list_id: listId,
    email: s.email,
    name: s.name || null,
  }));

  // Use upsert to skip duplicates
  const { error } = await supabase
    .from('subscribers')
    .upsert(rows, { onConflict: 'list_id,email', ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: subscribers.length });
}
