import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users - Get all registered users (Student Representative only)
export async function GET(request: NextRequest) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    if (payload.role !== 'REPRESENTATIVE') {
      return NextResponse.json(
        { error: 'Access denied. Student Representative only.' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: payload.userId }, // Exclude current Representative from management list
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isApproved: true,
        isBanned: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Fetch users admin error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching users.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Permanently ban a user and log their email in BanRecord (Student Representative only)
export async function POST(request: NextRequest) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    if (payload.role !== 'REPRESENTATIVE') {
      return NextResponse.json(
        { error: 'Access denied. Student Representative only.' },
        { status: 403 }
      );
    }

    const { userId, reason } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const userToBan = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToBan) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (userToBan.role === 'REPRESENTATIVE') {
      return NextResponse.json(
        { error: 'Representatives cannot be banned.' },
        { status: 400 }
      );
    }

    // Begin Transaction: Mark user banned, create permanent BanRecord
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isBanned: true },
      }),
      prisma.banRecord.upsert({
        where: { email: userToBan.email },
        update: { reason: reason || 'Banned by representative' },
        create: {
          email: userToBan.email,
          reason: reason || 'Banned by representative',
        },
      }),
    ]);

    return NextResponse.json({
      message: `User ${userToBan.name} has been permanently banned and their email added to the blacklist.`,
    });
  } catch (error: any) {
    console.error('Ban user error:', error);
    return NextResponse.json(
      { error: 'An error occurred while banning the user.' },
      { status: 500 }
    );
  }
}
