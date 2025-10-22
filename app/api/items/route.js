import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    
    const query = {};
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const status = searchParams.get('status');
    const verified = searchParams.get('verified');

    // Build search filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') query.category = category;
    if (location && location !== 'all') query.location = location;
    if (status && status !== 'all') query.status = status;
    if (verified === 'true') query.verified = true;

    // VERIFICATION FILTER: Show only verified items to public
    // Logged-in users see verified + their own items
    // Admins see everything
    if (!session) {
      // Not logged in - show only verified items
      query.verified = true;
    } else if (session.user.role !== 'admin') {
      // Logged-in non-admin users - show verified items + their own items
      query.$or = [
        { verified: true },
        { userId: session.user.id }
      ];
    }
    // Admin sees everything (no additional filter)

    const items = await db.collection('items')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, category, status, location, date, image, contactInfo } = body;

    if (!title || !description || !category || !status || !location || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const item = {
      id: uuidv4(),
      title,
      description,
      category,
      status,
      location,
      date,
      image: image || null,
      contactInfo: contactInfo || session.user.email,
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      verified: false, // All new items start as unverified
      createdAt: new Date().toISOString()
    };

    await db.collection('items').insertOne(item);

    return NextResponse.json(
      { 
        message: 'Item submitted successfully! Admin will verify within 24 hours.', 
        item 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
