import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check if banned (either on User model or BanRecord)
    const isBannedRecord = await prisma.banRecord.findUnique({
      where: { email: normalizedEmail },
    });
    if (user.isBanned || isBannedRecord) {
      return NextResponse.json(
        { error: 'Your account has been permanently banned.' },
        { status: 403 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check if approved
    if (!user.isApproved) {
      return NextResponse.json(
        { error: 'Your account is pending Student Representative approval.' },
        { status: 403 }
      );
    }

    // Sign JWT Token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
      isApproved: user.isApproved,
    });

    // Create response
    const response = NextResponse.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'An internal error occurred during login.' },
      { status: 500 }
    );
  }
}
