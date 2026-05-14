// app/api/admin/gallery/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  return request.headers.get('authorization') === `Bearer ${process.env.ADMIN_SECRET}`;
}

// ── GET: Fetch all gallery images ─────────────────────────────────────────────
export async function GET(request: Request) {
  if (!isAuthorized(request)) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const images = await sql`
      SELECT * FROM GalleryImages 
      ORDER BY display_order ASC, created_at DESC
    `;
    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error('Fetch gallery error:', error);
    return NextResponse.json({ error: 'Failed to fetch images.' }, { status: 500 });
  }
}

// ── POST: Save a new image URL to the database ────────────────────────────────
export async function POST(request: Request) {
  if (!isAuthorized(request)) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { image_url, alt_text } = await request.json();

    const result = await sql`
      INSERT INTO GalleryImages (image_url, alt_text)
      VALUES (${image_url}, ${alt_text || 'Smile Transformation'})
      RETURNING *
    `;

    return NextResponse.json({ success: true, image: result[0] });
  } catch (error) {
    console.error('Save image error:', error);
    return NextResponse.json({ error: 'Failed to save image.' }, { status: 500 });
  }
}

// ── DELETE: Remove image from Database AND Vercel Blob ────────────────────────
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { id, image_url } = await request.json();

    // 1. Delete from Database
    await sql`DELETE FROM GalleryImages WHERE id = ${id}`;

    // 2. Delete from Vercel Blob to keep storage clean
    if (image_url) {
      await del(image_url);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ error: 'Failed to delete image.' }, { status: 500 });
  }
}