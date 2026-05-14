import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  try {
    if (slug) {
      // Fetch a single post
      const post = await sql`SELECT * FROM BlogPosts WHERE slug = ${slug} AND is_published = TRUE LIMIT 1`;
      return NextResponse.json({ success: true, post: post[0] || null });
    } else {
      // Fetch all posts for the list page
      const posts = await sql`
        SELECT id, title, slug, excerpt, image_url, category, author, created_at 
        FROM BlogPosts 
        WHERE is_published = TRUE 
        ORDER BY created_at DESC
      `;
      return NextResponse.json({ success: true, posts });
    }
  } catch (error) {
    console.error('Fetch public blogs error:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs.' }, { status: 500 });
  }
}