import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Get all notifications for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const whereClause: any = { userId: payload.userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50, // Cap at 50 most recent notifications
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching notifications.' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { notificationId, markAll } = await request.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: payload.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: 'All notifications marked as read.' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 });
    }

    const updated = await prisma.notification.updateMany({
      where: { id: notificationId, userId: payload.userId },
      data: { isRead: true },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Notification not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification marked as read.' });
  } catch (error: any) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating notifications.' },
      { status: 500 }
    );
  }
}
