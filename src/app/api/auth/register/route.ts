import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password, role, department } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const validRoles = ['STUDENT', 'TEACHER', 'ALUMNI'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid user role selected.' },
        { status: 400 }
      );
    }

    // Check if the email is banned
    const isBanned = await prisma.banRecord.findUnique({
      where: { email: normalizedEmail },
    });
    if (isBanned) {
      return NextResponse.json(
        { error: 'This email address has been permanently banned from CampusVoice.' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        department: role === 'TEACHER' ? department || null : null,
        isApproved: false, // All registrations require manual approval
      },
    });

    return NextResponse.json(
      {
        message: 'Registration successful! Your account is pending approval by the Student Representative.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred during registration.' },
      { status: 500 }
    );
  }
}
