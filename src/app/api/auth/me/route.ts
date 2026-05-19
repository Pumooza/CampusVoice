import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const payload = getSession(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      );
    }

    // Verify user in the database (ensures we pick up bans or unapproval in real-time)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found.' },
        { status: 401 }
      );
    }

    if (user.isBanned) {
      const response = NextResponse.json(
        { error: 'Your account has been permanently banned.' },
        { status: 403 }
      );
      response.cookies.set({ name: 'auth_token', value: '', path: '/', maxAge: 0 });
      return response;
    }

    if (!user.isApproved) {
      const response = NextResponse.json(
        { error: 'Your account is pending Student Representative approval.' },
        { status: 403 }
      );
      response.cookies.set({ name: 'auth_token', value: '', path: '/', maxAge: 0 });
      return response;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error: any) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while fetching session.' },
      { status: 500 }
    );
  }
}
