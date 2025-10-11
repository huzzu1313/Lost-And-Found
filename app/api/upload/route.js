import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('Upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      console.log('No file in request');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File received:', file.name, file.size, file.type);

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Convert to base64 for storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log('File processed successfully');

    // Return data URL (can be stored in database)
    return NextResponse.json({ 
      url: dataUrl,
      message: 'Upload successful' 
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Upload failed: ' + error.message }, 
      { status: 500 }
    );
  }
}

// Add this for better error handling
export async function GET(request) {
  return NextResponse.json({ message: 'Upload API is working' });
}
