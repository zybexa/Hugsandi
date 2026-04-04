import { getSupabase } from '@/lib/supabase';
import { renderEmailHtml } from '@/lib/render-email';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ViewNewsletterPage({ params }: { params: { id: string } }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const design = {
    id: data.id,
    name: data.name,
    globalStyle: data.global_style,
    blocks: data.blocks,
  };

  const html = renderEmailHtml(design);

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}
