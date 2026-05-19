import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully!' });
  
  // Clear the cookie
  response.cookies.set({
    name: 'auth_token',
    value: '',
    path: '/',
    maxAge: 0,
  });

  return response;
}
