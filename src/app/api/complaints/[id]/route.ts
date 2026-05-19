import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { Status, Visibility } from '@prisma/client';
import { maskComplaintAuthor } from '../route';

// GET /api/complaints/[id] - Fetch a single complaint's details (with permission checks)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { id } = await params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        complainant: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        targetTeacher: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        attachments: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    const isOwner = complaint.complainantId === payload.userId;
    const isRep = payload.role === 'REPRESENTATIVE';
    const isTargetTeacher = complaint.targetTeacherId === payload.userId;

    // Authorization: Private complaints can only be seen by owner, target teacher, or rep
    if (complaint.visibility === Visibility.PRIVATE && !isOwner && !isRep && !isTargetTeacher) {
      return NextResponse.json(
        { error: 'You do not have permission to view this private complaint.' },
        { status: 403 }
      );
    }

    // Mask the complainant if anonymous
    const maskedComplaint = maskComplaintAuthor(complaint, payload.userId, payload.role);

    // If the complainant is anonymous, we also need to mask their replies in the comment thread!
    if (maskedComplaint.comments && maskedComplaint.isAnonymous) {
      maskedComplaint.comments = maskedComplaint.comments.map((comment: any) => {
        const isCommentOwner = comment.authorId === maskedComplaint.complainantId;
        if (comment.isAnonymous || (isCommentOwner && !isOwner && !isRep)) {
          return {
            ...comment,
            isAnonymous: true,
            author: {
              name: 'Anonymous Student (Complainant)',
              role: 'STUDENT',
            },
          };
        }
        return comment;
      });
    }

    return NextResponse.json({ complaint: maskedComplaint });
  } catch (error: any) {
    console.error('Fetch Single Complaint Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching complaint details.' },
      { status: 500 }
    );
  }
}

// PUT /api/complaints/[id] - Update complaint status (reopen, review, solve, reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { id } = await params;
    const { status, rejectionReason } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required.' }, { status: 400 });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    const isOwner = complaint.complainantId === payload.userId;
    const isRep = payload.role === 'REPRESENTATIVE';
    const isTargetTeacher = complaint.targetTeacherId === payload.userId;

    const targetStatus = status as Status;

    // Transition validation & Authorization
    if (isOwner) {
      // Students can only reopen a solved or rejected complaint
      if (targetStatus === Status.PENDING || targetStatus === Status.UNDER_REVIEW) {
        if (complaint.status !== Status.SOLVED && complaint.status !== Status.REJECTED) {
          return NextResponse.json(
            { error: 'You can only reopen complaints that are Solved or Rejected.' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Students can only transition complaints to reopen them (Pending/Under Review).' },
          { status: 403 }
        );
      }
    } else if (isRep || isTargetTeacher) {
      // Teachers and Reps can update status freely
      const allowedStatuses: Status[] = [
        Status.UNDER_REVIEW,
        Status.AWAITING_STUDENT_RESPONSE,
        Status.SOLVED,
        Status.REJECTED,
      ];

      // Only Representatives can hide complaints
      if (targetStatus === Status.HIDDEN && !isRep) {
        return NextResponse.json(
          { error: 'Only Student Representatives can hide complaints.' },
          { status: 403 }
        );
      }

      if (targetStatus === Status.HIDDEN) {
        // Allowed
      } else if (!allowedStatuses.includes(targetStatus)) {
        return NextResponse.json(
          { error: 'Invalid status transition.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'You do not have permission to moderate this complaint.' },
        { status: 403 }
      );
    }

    // Special PRD Rule: "Rejected private complaints become public temporarily and are permanently deleted after 7 days"
    let updatedVisibility = complaint.visibility;
    if (targetStatus === Status.REJECTED && complaint.visibility === Visibility.PRIVATE) {
      updatedVisibility = Visibility.PUBLIC;
    }

    // Update complaint
    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        status: targetStatus,
        rejectionReason: targetStatus === Status.REJECTED ? rejectionReason || 'No reason provided.' : null,
        visibility: updatedVisibility,
      },
    });

    // Create system notification for submitter
    await prisma.notification.create({
      data: {
        userId: complaint.complainantId,
        title: 'Complaint Status Updated',
        message: `Your complaint "${complaint.summary.substring(0, 25)}..." is now marked as ${targetStatus.replace('_', ' ').toLowerCase()}.`,
        link: `/complaints/${complaint.id}`,
      },
    });

    return NextResponse.json({
      message: `Complaint successfully marked as ${targetStatus}!`,
      complaint: updatedComplaint,
    });
  } catch (error: any) {
    console.error('Update Complaint Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the complaint.' },
      { status: 500 }
    );
  }
}

// DELETE /api/complaints/[id] - Permanent deletion of complaint (Representative only)
export async function DELETE(
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
        { error: 'Only Student Representatives are permitted to delete complaints.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    await prisma.complaint.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Complaint has been permanently deleted.',
    });
  } catch (error: any) {
    console.error('Delete Complaint Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the complaint.' },
      { status: 500 }
    );
  }
}
