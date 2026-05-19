import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { Status, Visibility } from '@prisma/client';

// Helper to filter and mask anonymous author data based on user role
export function maskComplaintAuthor(complaint: any, currentUserId: string, currentUserRole: string) {
  const isOwner = complaint.complainantId === currentUserId;
  const isRep = currentUserRole === 'REPRESENTATIVE';

  if (complaint.isAnonymous && !isOwner && !isRep) {
    return {
      ...complaint,
      complainant: {
        name: 'Anonymous Student',
        role: complaint.complainant?.role || 'STUDENT',
      },
    };
  }
  return complaint;
}

// GET /api/complaints - Fetch list of complaints with role-based access & filtering
export async function GET(request: NextRequest) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const teacherId = searchParams.get('teacherId');
    const department = searchParams.get('department');
    const feedType = searchParams.get('feedType'); // "public", "my", "assigned"

    const whereClause: any = {};

    // 1. Role-Based Visibility Filters
    if (payload.role === 'REPRESENTATIVE') {
      // Reps can see everything, but respect custom feed types if requested
      if (feedType === 'public') {
        whereClause.visibility = Visibility.PUBLIC;
      }
    } else if (payload.role === 'TEACHER') {
      // Teachers can see:
      // - All Public complaints
      // - Private complaints targeted at them specifically
      whereClause.OR = [
        { visibility: Visibility.PUBLIC },
        {
          AND: [
            { visibility: Visibility.PRIVATE },
            { targetTeacherId: payload.userId }
          ]
        }
      ];

      // Exclude hidden complaints for teachers (unless directed at them? Standard is they see active only)
      whereClause.status = { not: Status.HIDDEN };
    } else {
      // Students and Alumni can see:
      // - All Public active (non-solved, non-hidden) complaints in the public feed
      // - OR all of their own complaints (public, private, solved, hidden, etc.)
      if (feedType === 'my') {
        whereClause.complainantId = payload.userId;
      } else {
        // Public feed defaults
        whereClause.visibility = Visibility.PUBLIC;
        // Public feed restrictions: no hidden complaints, no solved complaints
        whereClause.status = { notIn: [Status.HIDDEN, Status.SOLVED] };
      }
    }

    // 2. Query Filters (Category, Status, Teacher, Department)
    if (category) {
      whereClause.categories = { contains: category };
    }

    if (status && payload.role === 'REPRESENTATIVE') {
      // Reps can filter by any status, including Hidden
      whereClause.status = status as Status;
    } else if (status) {
      const selectedStatus = status as Status;
      // Prevent non-reps from explicitly querying hidden complaints
      if (selectedStatus !== Status.HIDDEN) {
        whereClause.status = selectedStatus;
      }
    }

    if (teacherId) {
      whereClause.targetTeacherId = teacherId;
    }

    if (department) {
      whereClause.targetTeacher = {
        department: department
      };
    }

    // Fetch complaints
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        complainant: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        targetTeacher: {
          select: {
            name: true,
            email: true,
            department: true,
          },
        },
        attachments: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Mask Anonymous Complainants
    const maskedComplaints = complaints.map((c) =>
      maskComplaintAuthor(c, payload.userId, payload.role)
    );

    return NextResponse.json({ complaints: maskedComplaints });
  } catch (error: any) {
    console.error('Fetch Complaints Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching complaints.' },
      { status: 500 }
    );
  }
}

// POST /api/complaints - Submit a new complaint (Students and Alumni only)
export async function POST(request: Request) {
  try {
    const payload = getSession(request as NextRequest);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    if (payload.role !== 'STUDENT' && payload.role !== 'ALUMNI') {
      return NextResponse.json(
        { error: 'Only students and alumni can submit complaints.' },
        { status: 403 }
      );
    }

    const {
      summary,
      description,
      categories, // Array of strings or comma-separated string
      tags,
      targetTeacherId,
      visibility,
      isAnonymous,
      attachments, // Array of already uploaded files [{ filename, original, mimeType, url }]
    } = await request.json();

    if (!summary || !description || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Summary, description, and at least one category are required.' },
        { status: 400 }
      );
    }

    // Word count validation (max 1000 words)
    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount > 1000) {
      return NextResponse.json(
        { error: `Description exceeds the 1000-word limit (Current count: ${wordCount}).` },
        { status: 400 }
      );
    }

    // Format categories as comma-separated string
    const formattedCategories = Array.isArray(categories)
      ? categories.join(',')
      : categories;

    // Create the complaint
    const newComplaint = await prisma.complaint.create({
      data: {
        summary: summary.trim(),
        description: description.trim(),
        categories: formattedCategories,
        tags: tags || null,
        visibility: visibility === 'PRIVATE' ? Visibility.PRIVATE : Visibility.PUBLIC,
        isAnonymous: !!isAnonymous,
        status: Status.PENDING,
        complainantId: payload.userId,
        targetTeacherId: targetTeacherId || null,
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
        attachments: true,
      },
    });

    // Create system notification for target teacher (if private/public with teacher) or representatives
    if (newComplaint.targetTeacherId) {
      await prisma.notification.create({
        data: {
          userId: newComplaint.targetTeacherId,
          title: 'New Complaint Assigned',
          message: `A new complaint has been directed at you: "${newComplaint.summary.substring(0, 30)}..."`,
          link: `/complaints/${newComplaint.id}`,
        },
      });
    }

    // Notify representatives
    const reps = await prisma.user.findMany({
      where: { role: 'REPRESENTATIVE' },
    });
    for (const rep of reps) {
      await prisma.notification.create({
        data: {
          userId: rep.id,
          title: 'New Complaint Submitted',
          message: `A student submitted a new ${newComplaint.visibility.toLowerCase()} complaint.`,
          link: `/complaints/${newComplaint.id}`,
        },
      });
    }

    return NextResponse.json(
      {
        message: 'Complaint submitted successfully!',
        complaint: newComplaint,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create Complaint Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during complaint submission.' },
      { status: 500 }
    );
  }
}
