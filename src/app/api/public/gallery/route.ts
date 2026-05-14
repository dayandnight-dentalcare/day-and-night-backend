import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const images = await sql`
      SELECT id, image_url, alt_text 
      FROM GalleryImages 
      ORDER BY display_order ASC, created_at DESC
    `;
    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error('Fetch public gallery error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery.' }, { status: 500 });
  }
}