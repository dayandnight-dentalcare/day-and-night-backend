// D:\CHV Apps\Day_and_Night\app\backend\src\app\api\admin\upload\route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Force dynamic execution
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  return request.headers.get('authorization') === `Bearer ${process.env.ADMIN_SECRET}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads'; // e.g., 'gallery' or 'blogs'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Ensure it's an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image.' }, { status: 400 });
    }

    // Upload to Vercel Blob
    // We use the `folder/filename` structure to keep things organized in your bucket
    const blob = await put(`${folder}/${file.name}`, file, {
      access: 'public',
      // Optional: automatically throw away the original filename and generate a random string
      // to avoid file overwrite collisions, but keeping it simple for now.
    });

    // Return the public URL to the admin panel
    return NextResponse.json({ 
      success: true, 
      url: blob.url 
    });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}