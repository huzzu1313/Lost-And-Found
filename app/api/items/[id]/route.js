import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDb } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const db = await getDb();
    const item = await db.collection('items').findOne({ id });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const db = await getDb();

    const item = await db.collection('items').findOne({ id });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Only admin or item owner can update
    if (session.user.role !== 'admin' && session.user.id !== item.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const updates = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    await db.collection('items').updateOne(
      { id },
      { $set: updates }
    );

    const updatedItem = await db.collection('items').findOne({ id });

    return NextResponse.json(
      { message: 'Item updated successfully', item: updatedItem }
    );
  } catch (error) {
    console.error('Update item error:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const db = await getDb();

    const item = await db.collection('items').findOne({ id });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Only admin or item owner can delete
    if (session.user.role !== 'admin' && session.user.id !== item.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await db.collection('items').deleteOne({ id });

    return NextResponse.json(
      { message: 'Item deleted successfully' }
    );
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
