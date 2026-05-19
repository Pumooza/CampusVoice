import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-campus-voice';

export interface UserTokenPayload {
  userId: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'REPRESENTATIVE' | 'ALUMNI';
  name: string;
  department: string | null;
  isApproved: boolean;
}

export function signToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserTokenPayload;
  } catch (error) {
    return null;
  }
}

export function getSession(req: NextRequest): UserTokenPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
