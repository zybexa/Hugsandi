import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { getResend } from '@/lib/resend';
import { renderEmailHtml } from '@/lib/render-email';
import { Design } from '@/types/design';
import { DEFAULT_GLOBAL_STYLE } from '@/lib/defaults';

// Test-send endpoint. Sends the newsletter to the entire email list with a
// dummy [TEST] subject prefix. Unlike /api/send, this route:
//   - Does NOT check whether the design has been sent before (re-sendable)
//   - Does NOT write to newsletter_sends or send_recipients
//   - Does NOT affect dashboard stats or block subsequent real sends
// Use only in dev/testing flows.
export async function POST(request: Request) {
  const body = await request.json();
  const { designId } = body as { designId: string };

  if (!designId) {
    return NextResponse.json({ error: 'designId is required' }, { status: 400 });
  }

  const supabase = getSupabase();

  const [designResult, listResult] = await Promise.all([
    supabase.from('designs').select('*').eq('id', designId).single(),
    supabase.from('email_lists').select('id, name').limit(1).single(),
  ]);

  const { data: designRow, error: designError } = designResult;
  if (designError || !designRow) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }

  const { data: list, error: listError } = listResult;
  if (listError || !list) {
    return NextResponse.json({ error: 'No email list found' }, { status: 400 });
  }

  const { data: subscribers, error: subError } = await supabase
    .from('subscribers')
    .select('email')
    .eq('list_id', list.id);

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: 'No subscribers in this list' }, { status: 400 });
  }

  const design: Design = {
    id: designRow.id,
    name: designRow.name,
    globalStyle: designRow.global_style || DEFAULT_GLOBAL_STYLE,
    blocks: designRow.blocks || [],
  };

  // Dummy subject with a unique suffix so each repeated test doesn't thread
  // into the same Gmail conversation.
  const testSubject = `[TEST] ${design.name || 'Newsletter'} — ${new Date().toISOString().slice(11, 19)}`;

  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;
  const viewUrl = `${baseUrl}/view/${designId}`;

  const designWithViewUrl: Design = {
    ...design,
    blocks: design.blocks.map((block) => {
      if (block.data.type === 'header' && block.data.viewInBrowserText && viewUrl) {
        return { ...block, data: { ...block.data, viewInBrowserUrl: viewUrl } };
      }
      return block;
    }),
  };

  const html = renderEmailHtml(designWithViewUrl, baseUrl);
  const resend = getResend();
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  let sentCount = 0;
  const errors: string[] = [];

  const BATCH_SIZE = 25;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((subscriber) =>
        resend.emails.send({
          from,
          to: subscriber.email,
          subject: testSubject,
          html,
          tags: [{ name: 'test', value: 'true' }],
        }).then((result) => ({ email: subscriber.email, result }))
      )
    );

    for (const settled of results) {
      if (settled.status === 'fulfilled') {
        const { email, result } = settled.value;
        if (result.error) {
          console.error(`[TEST] Resend API error for ${email}:`, result.error);
          const errMsg = typeof result.error === 'object' && 'message' in result.error
            ? (result.error as { message: string }).message
            : JSON.stringify(result.error);
          errors.push(`Failed to send to ${email}: ${errMsg}`);
        } else {
          sentCount++;
        }
      } else {
        const email = batch[results.indexOf(settled)]?.email || 'unknown';
        console.error(`[TEST] Resend network/exception for ${email}:`, settled.reason);
        errors.push(`Failed to send to ${email}: ${settled.reason instanceof Error ? settled.reason.message : 'Unknown error'}`);
      }
    }
  }

  return NextResponse.json({
    sent: sentCount,
    failed: errors.length,
    subject: testSubject,
    errors: errors.length > 0 ? errors : undefined,
  });
}
