import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET /api/admin/registrations - List all pending user account approvals (Student Representative only)
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

    const pendingUsers = await prisma.user.findMany({
      where: { isApproved: false, isBanned: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ users: pendingUsers });
  } catch (error: any) {
    console.error('Pending registrations error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching pending accounts.' },
      { status: 500 }
    );
  }
}
