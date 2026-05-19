import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

// GET /api/admin/analytics - System performance statistics (Student Representative only)
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

    // 1. Complaint Status Overview
    const allComplaints = await prisma.complaint.findMany({
      include: {
        targetTeacher: {
          select: { department: true }
        }
      }
    });

    const total = allComplaints.length;
    const resolved = allComplaints.filter(c => c.status === Status.SOLVED).length;
    const pending = allComplaints.filter(c => c.status === Status.PENDING).length;
    const underReview = allComplaints.filter(c => c.status === Status.UNDER_REVIEW).length;
    const awaitingResponse = allComplaints.filter(c => c.status === Status.AWAITING_STUDENT_RESPONSE).length;
    const rejected = allComplaints.filter(c => c.status === Status.REJECTED).length;
    const hidden = allComplaints.filter(c => c.status === Status.HIDDEN).length;

    // 2. Complaint Volume by Category
    const categoryCounts: { [key: string]: number } = {
      'Academic': 0,
      'Teacher Behavior': 0,
      'Harassment': 0,
      'Attendance': 0,
      'Hostel': 0,
      'Fee Issues': 0,
      'Exam / Result Issues': 0,
      'IT / Lab Issues': 0,
      'University Issues': 0,
      'Other': 0,
    };

    allComplaints.forEach((complaint) => {
      if (complaint.categories) {
        const cats = complaint.categories.split(',');
        cats.forEach((cat) => {
          const trimmedCat = cat.trim();
          if (categoryCounts[trimmedCat] !== undefined) {
            categoryCounts[trimmedCat]++;
          } else {
            categoryCounts['Other']++;
          }
        });
      }
    });

    // 3. Complaint Volume by Department (based on target teacher's department)
    const departmentCounts: { [key: string]: number } = {};
    allComplaints.forEach((complaint) => {
      const dept = complaint.targetTeacher?.department || 'Unassigned / Institutional';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    // 4. Average Resolution Time and Resolution SLA metrics (7 days SLA)
    const solvedComplaints = allComplaints.filter((c) => c.status === Status.SOLVED);
    let totalResolutionTimeMs = 0;
    let metSlaCount = 0;

    solvedComplaints.forEach((c) => {
      const durationMs = c.updatedAt.getTime() - c.createdAt.getTime();
      totalResolutionTimeMs += durationMs;

      // 7 days SLA = 7 * 24 * 60 * 60 * 1000 = 604,800,000 ms
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      if (durationMs <= SEVEN_DAYS_MS) {
        metSlaCount++;
      }
    });

    const averageResolutionTimeHours = solvedComplaints.length > 0
      ? Math.round((totalResolutionTimeMs / solvedComplaints.length) / (1000 * 60 * 60))
      : 0;

    const slaComplianceRate = solvedComplaints.length > 0
      ? Math.round((metSlaCount / solvedComplaints.length) * 100)
      : 100; // Default to 100% compliance if no complaints solved

    // 5. Response SLA (48-hour check) - active complaints reviewed (moved out of PENDING)
    const reviewedComplaints = allComplaints.filter((c) => c.status !== Status.PENDING);
    let metResponseSlaCount = 0;
    reviewedComplaints.forEach((c) => {
      // For simplicity, since we do not have historical transition logs, we use the gap between createdAt and updatedAt.
      // If a complaint has moved from PENDING, we check how long it took.
      const responseDurationMs = c.updatedAt.getTime() - c.createdAt.getTime();
      const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
      if (responseDurationMs <= FORTY_EIGHT_HOURS_MS) {
        metResponseSlaCount++;
      }
    });

    const responseSlaComplianceRate = reviewedComplaints.length > 0
      ? Math.round((metResponseSlaCount / reviewedComplaints.length) * 100)
      : 100;

    return NextResponse.json({
      statistics: {
        total,
        resolved,
        pending,
        underReview,
        awaitingResponse,
        rejected,
        hidden,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        averageResolutionTimeHours,
        slaComplianceRate,
        responseSlaComplianceRate,
      },
      categoryData: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })),
      departmentData: Object.entries(departmentCounts).map(([name, value]) => ({ name, value })),
    });
  } catch (error: any) {
    console.error('Analytics Fetch Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while building system analytics.' },
      { status: 500 }
    );
  }
}
