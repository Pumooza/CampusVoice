import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        isApproved: true,
        isBanned: false,
      },
      select: {
        id: true,
        name: true,
        department: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ teachers });
  } catch (error: any) {
    console.error('Fetch teachers list error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching teachers.' },
      { status: 500 }
    );
  }
}
