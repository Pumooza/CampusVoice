import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/jwt';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const payload = getSession(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Attachment validation (2 MB limit)
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 2 MB limit.' },
        { status: 400 }
      );
    }

    // Allowed mime types
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF, JPG, and PNG are allowed.' },
        { status: 400 }
      );
    }

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create unique random filename
    const originalExt = path.extname(file.name) || '.bin';
    const randomHex = crypto.randomBytes(6).toString('hex');
    const cleanFilename = `evidence_${randomHex}${originalExt}`;

    // Upload folder setup
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, cleanFilename);
    await fs.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${cleanFilename}`;

    return NextResponse.json({
      message: 'File uploaded successfully!',
      attachment: {
        filename: cleanFilename,
        original: file.name,
        mimeType: file.type,
        url: relativeUrl,
      },
    });
  } catch (error: any) {
    console.error('File Upload Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during file upload.' },
      { status: 500 }
    );
  }
}
