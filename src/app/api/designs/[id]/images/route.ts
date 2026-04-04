import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('design_images')
    .select('id, url, filename, created_at')
    .eq('design_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data || []).map((img) => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      createdAt: img.created_at,
    }))
  );
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { imageId } = body;

  if (!imageId) {
    return NextResponse.json({ error: 'imageId is required' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Get the image record to find the storage path
  const { data: img } = await supabase
    .from('design_images')
    .select('url')
    .eq('id', imageId)
    .eq('design_id', params.id)
    .single();

  // Delete the database record
  const { error } = await supabase
    .from('design_images')
    .delete()
    .eq('id', imageId)
    .eq('design_id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Delete the file from storage
  if (img?.url) {
    const path = img.url.split('/newsletter-images/').pop();
    if (path) {
      await supabase.storage.from('newsletter-images').remove([path]);
    }
  }

  return NextResponse.json({ success: true });
}
