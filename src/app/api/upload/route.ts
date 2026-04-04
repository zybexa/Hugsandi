import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import sharp from 'sharp';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 1200;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  const supabase = getSupabase();
  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Optimize image with Sharp
  let optimized: Buffer;
  let outputType: string;
  const isPng = file.type === 'image/png';

  try {
    let pipeline = sharp(rawBuffer).resize({ width: MAX_WIDTH, withoutEnlargement: true });

    if (isPng) {
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
      outputType = 'image/png';
    } else {
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
      outputType = 'image/jpeg';
    }

    optimized = await pipeline.rotate().toBuffer();
  } catch {
    // If Sharp fails, fall back to original
    optimized = rawBuffer;
    outputType = file.type;
  }

  const ext = isPng ? 'png' : 'jpg';
  const filename = `${nanoid()}.${ext}`;

  const { error } = await supabase.storage
    .from('newsletter-images')
    .upload(filename, optimized, {
      contentType: outputType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from('newsletter-images')
    .getPublicUrl(filename);

  const publicUrl = urlData.publicUrl;

  // Associate with design if designId provided
  const designId = formData.get('designId') as string | null;
  let imageId: string | undefined;
  let createdAt: string | undefined;

  if (designId) {
    const { data: imgRecord, error: imgError } = await supabase
      .from('design_images')
      .insert({ design_id: designId, url: publicUrl, filename: file.name })
      .select('id, created_at')
      .single();
    if (imgError) {
      console.error('Failed to insert design_images record:', imgError.message);
    }
    if (imgRecord) {
      imageId = imgRecord.id;
      createdAt = imgRecord.created_at;
    }
  }

  return NextResponse.json({ url: publicUrl, filename: file.name, imageId, createdAt });
}
