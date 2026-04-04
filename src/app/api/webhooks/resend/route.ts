import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getResend } from '@/lib/resend';

const STATUS_ORDER: Record<string, number> = {
  failed: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
};

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const svixId = request.headers.get('svix-id') || '';
  const svixTimestamp = request.headers.get('svix-timestamp') || '';
  const svixSignature = request.headers.get('svix-signature') || '';

  const resend = getResend();

  let event: ReturnType<typeof resend.webhooks.verify>;
  try {
    event = resend.webhooks.verify({
      payload: body,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const eventType = (event as { type?: string }).type;
  if (
    eventType !== 'email.delivered' &&
    eventType !== 'email.opened' &&
    eventType !== 'email.bounced' &&
    eventType !== 'email.failed'
  ) {
    return NextResponse.json({ received: true });
  }

  const emailId = (event as { data?: { email_id?: string } }).data?.email_id;
  if (!emailId) {
    return NextResponse.json({ received: true });
  }

  const newStatus =
    eventType === 'email.delivered' ? 'delivered'
    : eventType === 'email.opened' ? 'opened'
    : eventType === 'email.bounced' ? 'failed'
    : 'failed';

  const supabase = getSupabase();

  // Find the recipient record
  const { data: recipient } = await supabase
    .from('send_recipients')
    .select('id, send_id, status')
    .eq('resend_email_id', emailId)
    .single();

  if (!recipient) {
    return NextResponse.json({ received: true });
  }

  // Only upgrade status, never downgrade (but allow same-level transitions)
  if ((STATUS_ORDER[newStatus] ?? 0) < (STATUS_ORDER[recipient.status] ?? 0)) {
    return NextResponse.json({ received: true });
  }

  // Update recipient status
  await supabase
    .from('send_recipients')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', recipient.id);

  // Recompute aggregate counts on newsletter_sends
  const { data: allRecipients } = await supabase
    .from('send_recipients')
    .select('status')
    .eq('send_id', recipient.send_id);

  if (allRecipients) {
    const deliveredCount = allRecipients.filter(
      (r) => r.status === 'delivered' || r.status === 'opened'
    ).length;
    const openedCount = allRecipients.filter((r) => r.status === 'opened').length;

    await supabase
      .from('newsletter_sends')
      .update({ delivered_count: deliveredCount, opened_count: openedCount })
      .eq('id', recipient.send_id);
  }

  return NextResponse.json({ received: true });
}
