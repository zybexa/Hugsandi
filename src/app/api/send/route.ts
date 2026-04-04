import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { getResend } from '@/lib/resend';
import { renderEmailHtml } from '@/lib/render-email';
import { Design } from '@/types/design';
import { DEFAULT_GLOBAL_STYLE } from '@/lib/defaults';

export async function POST(request: Request) {
  const body = await request.json();
  const { designId, subject } = body as {
    designId: string;
    subject: string;
  };

  if (!designId) {
    return NextResponse.json({ error: 'designId is required' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Fetch design, check existing send, and get list in parallel
  const [designResult, existingSendResult, listResult] = await Promise.all([
    supabase.from('designs').select('*').eq('id', designId).single(),
    supabase.from('newsletter_sends').select('id').eq('design_id', designId).limit(1).maybeSingle(),
    supabase.from('email_lists').select('id, name').limit(1).single(),
  ]);

  const { data: designRow, error: designError } = designResult;
  if (designError || !designRow) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }

  if (existingSendResult.data) {
    return NextResponse.json({ error: 'This newsletter has already been sent' }, { status: 400 });
  }

  const { data: list, error: listError } = listResult;
  if (listError || !list) {
    return NextResponse.json({ error: 'No email list found' }, { status: 400 });
  }

  // Get subscribers (depends on list.id)
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

  // 5. Build the design object
  const design: Design = {
    id: designRow.id,
    name: designRow.name,
    globalStyle: designRow.global_style || DEFAULT_GLOBAL_STYLE,
    blocks: designRow.blocks || [],
  };

  const emailSubject = subject || design.name || 'Newsletter';

  // 6. Create newsletter_sends record
  const { data: sendRecord, error: sendError } = await supabase
    .from('newsletter_sends')
    .insert({
      design_id: designId,
      list_id: list.id,
      subject: emailSubject,
      recipient_count: subscribers.length,
    })
    .select('id')
    .single();

  if (sendError || !sendRecord) {
    return NextResponse.json({ error: 'Failed to create send record' }, { status: 500 });
  }

  const sendId = sendRecord.id;

  // 7. Build the view URL and inject into header blocks
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const viewUrl = `${protocol}://${host}/view/${designId}`;

  const designWithViewUrl: Design = {
    ...design,
    blocks: design.blocks.map((block) => {
      if (block.data.type === 'header' && block.data.viewInBrowserText && viewUrl) {
        return {
          ...block,
          data: { ...block.data, viewInBrowserUrl: viewUrl },
        };
      }
      return block;
    }),
  };

  // 8. Render email HTML
  const html = renderEmailHtml(designWithViewUrl);
  const resend = getResend();
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  // 9. Send emails in parallel batches
  let sentCount = 0;
  const errors: string[] = [];
  const recipientRecords: Array<{
    send_id: string;
    email: string;
    resend_email_id: string | null;
    status: string;
  }> = [];

  const BATCH_SIZE = 25;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((subscriber) =>
        resend.emails.send({
          from,
          to: subscriber.email,
          subject: emailSubject,
          html,
          tags: [{ name: 'send_id', value: sendId }],
        }).then((result) => ({ email: subscriber.email, result }))
      )
    );

    for (const settled of results) {
      if (settled.status === 'fulfilled') {
        recipientRecords.push({
          send_id: sendId,
          email: settled.value.email,
          resend_email_id: settled.value.result.data?.id || null,
          status: 'sent',
        });
        sentCount++;
      } else {
        const email = batch[results.indexOf(settled)]?.email || 'unknown';
        recipientRecords.push({
          send_id: sendId,
          email,
          resend_email_id: null,
          status: 'failed',
        });
        errors.push(`Failed to send to ${email}: ${settled.reason instanceof Error ? settled.reason.message : 'Unknown error'}`);
      }
    }
  }

  // 10. Bulk insert recipient records
  if (recipientRecords.length > 0) {
    const { error: recipientError } = await supabase.from('send_recipients').insert(recipientRecords);
    if (recipientError) {
      console.error('Failed to insert send_recipients:', recipientError.message);
    }
  }

  // 11. Update send record with final counts
  await supabase
    .from('newsletter_sends')
    .update({
      sent_count: sentCount,
      failed_count: errors.length,
    })
    .eq('id', sendId);

  return NextResponse.json({
    sent: sentCount,
    failed: errors.length,
    sendId,
    errors: errors.length > 0 ? errors : undefined,
  });
}
