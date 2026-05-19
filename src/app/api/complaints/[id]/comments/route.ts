import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { Visibility } from '@prisma/client';

// POST /api/complaints/[id]/comments - Add a reply to a complaint discussion thread
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { id } = await params;
    const { content, attachments } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required.' }, { status: 400 });
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

    // Authorization checks
    if (complaint.visibility === Visibility.PRIVATE && !isOwner && !isRep && !isTargetTeacher) {
      return NextResponse.json(
        { error: 'You do not have access to participate in this private thread.' },
        { status: 403 }
      );
    }

    // Students CANNOT comment on others' complaints
    if (payload.role === 'STUDENT' && !isOwner) {
      return NextResponse.json(
        { error: 'Students can only reply within their own complaints.' },
        { status: 403 }
      );
    }

    // Anonymity model: Students replying inside their own anonymous complaint will reply anonymously
    const isCommentAnonymous = isOwner && complaint.isAnonymous;

    // Create comment
    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        isAnonymous: isCommentAnonymous,
        complaintId: complaint.id,
        authorId: payload.userId,
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map((att: any) => ({
            filename: att.filename,
            original: att.original,
            mimeType: att.mimeType,
            url: att.url,
          })),
        } : undefined,
      },
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
    });

    // Notify appropriate parties in the thread
    const notifyUserIds = new Set<string>();
    
    // Notify the submitter if a teacher or rep commented
    if (!isOwner) {
      notifyUserIds.add(complaint.complainantId);
    }
    
    // Notify target teacher if someone else commented
    if (complaint.targetTeacherId && complaint.targetTeacherId !== payload.userId) {
      notifyUserIds.add(complaint.targetTeacherId);
    }

    // Send notifications
    for (const notifyUserId of notifyUserIds) {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          title: 'New Reply Received',
          message: `There is a new reply on the complaint "${complaint.summary.substring(0, 25)}..."`,
          link: `/complaints/${complaint.id}`,
        },
      });
    }

    // Mask author in return if comment is anonymous
    let returnedComment = newComment;
    if (isCommentAnonymous && !isOwner && !isRep) {
      returnedComment = {
        ...newComment,
        author: {
          id: 'anonymous',
          name: 'Anonymous Student (Complainant)',
          role: 'STUDENT',
        },
      };
    }

    return NextResponse.json(
      {
        message: 'Reply added successfully!',
        comment: returnedComment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create Comment Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding the reply.' },
      { status: 500 }
    );
  }
}
