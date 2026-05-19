import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/registrations/[id] - Approve or Reject a pending user account
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { action } = await request.json();

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json(
        { error: 'Invalid action. Specify APPROVE or REJECT.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToModerate = await prisma.user.findUnique({
      where: { id },
    });

    if (!userToModerate) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      await prisma.user.update({
        where: { id },
        data: { isApproved: true },
      });
      return NextResponse.json({ message: `Account for ${userToModerate.name} has been approved.` });
    } else {
      // Rejection: permanently delete user account from registration queue
      await prisma.user.delete({
        where: { id },
      });
      return NextResponse.json({ message: `Registration for ${userToModerate.name} has been rejected and deleted.` });
    }
  } catch (error: any) {
    console.error('Moderate registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during account moderation.' },
      { status: 500 }
    );
  }
}
