import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase();

  // Fetch design and latest send in parallel
  const [designResult, sendResult] = await Promise.all([
    supabase.from('designs').select('*').eq('id', params.id).single(),
    supabase
      .from('newsletter_sends')
      .select('sent_at')
      .eq('design_id', params.id)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data, error } = designResult;
  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Design not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    globalStyle: data.global_style,
    blocks: data.blocks,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastSentAt: sendResult.data?.sent_at || null,
  });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { name, globalStyle, blocks } = body;

  const supabase = getSupabase();
  const blockList = Array.isArray(blocks) ? blocks : [];
  const contentCards = blockList.filter((b: { data?: { type?: string } }) => b.data?.type === 'content-card');
  const isComplete = contentCards.length > 0 && contentCards.every((b: { data?: { title?: string; body?: string; ctaText?: string; ctaUrl?: string } }) => {
    const d = b.data;
    return d && d.title?.trim() && d.body?.trim() && d.ctaText?.trim() && d.ctaUrl?.trim();
  });

  const { error } = await supabase
    .from('designs')
    .update({
      name,
      global_style: globalStyle,
      blocks,
      block_count: blockList.length,
      is_complete: isComplete,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase();

  // Get all image URLs before deleting (cascade will remove DB records)
  const { data: images } = await supabase
    .from('design_images')
    .select('url')
    .eq('design_id', params.id);

  const { error } = await supabase.from('designs').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Delete files from storage
  if (images && images.length > 0) {
    const paths = images
      .map((img) => img.url.split('/newsletter-images/').pop())
      .filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from('newsletter-images').remove(paths);
    }
  }

  return NextResponse.json({ success: true });
}
