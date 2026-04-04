import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabase();

  // Fetch designs, sends, and subscriber count in parallel
  const [designsResult, sendsResult, subscriberResult] = await Promise.all([
    supabase
      .from('designs')
      .select('id, name, blocks, created_at, updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('newsletter_sends')
      .select('design_id, subject, recipient_count, sent_count, failed_count, delivered_count, opened_count, sent_at')
      .order('sent_at', { ascending: false }),
    supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true }),
  ]);

  const { data: designs, error: designsError } = designsResult;
  if (designsError) {
    return NextResponse.json({ error: designsError.message }, { status: 500 });
  }

  const { data: sends } = sendsResult;
  const { count: subscriberCount } = subscriberResult;

  // 4. Group sends by design_id, take most recent per design
  const sendsByDesign = new Map<string, (typeof sends extends (infer T)[] | null ? T : never)>();
  if (sends) {
    for (const send of sends) {
      if (send.design_id && !sendsByDesign.has(send.design_id)) {
        sendsByDesign.set(send.design_id, send);
      }
    }
  }

  // 5. Build response
  const newsletters = (designs || []).map((design) => {
    const send = sendsByDesign.get(design.id);
    const recipientCount = send?.recipient_count ?? 0;
    const deliveredCount = send?.delivered_count ?? 0;
    const openedCount = send?.opened_count ?? 0;

    // Check if all content cards are complete
    const blocks = Array.isArray(design.blocks) ? design.blocks : [];
    const contentCards = blocks.filter((b: { data?: { type?: string } }) => b.data?.type === 'content-card');
    const isComplete = contentCards.length > 0 && contentCards.every((b: { data?: { title?: string; body?: string; ctaText?: string; ctaUrl?: string } }) => {
      const d = b.data;
      return d && d.title?.trim() && d.body?.trim() && d.ctaText?.trim() && d.ctaUrl?.trim();
    });

    return {
      id: design.id,
      name: design.name,
      createdAt: design.created_at,
      updatedAt: design.updated_at,
      blockCount: blocks.length,
      isComplete,
      lastSentAt: send?.sent_at ?? null,
      recipientCount,
      deliveredCount,
      deliveredPercent: recipientCount > 0 ? Math.round((deliveredCount / recipientCount) * 100) : 0,
      openedCount,
      openedPercent: recipientCount > 0 ? Math.round((openedCount / recipientCount) * 100) : 0,
    };
  });

  // 6. Sort by most recent activity
  newsletters.sort((a, b) => {
    const aDate = a.lastSentAt || a.updatedAt;
    const bDate = b.lastSentAt || b.updatedAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return NextResponse.json(
    { subscriberCount: subscriberCount ?? 0, newsletters },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
