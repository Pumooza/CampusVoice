import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Manually load .env variables for TSX/CLI runner environment compatibility
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          const value = valueParts.join('=').trim().replace(/^"|"$/g, '');
          process.env[key.trim()] = value;
        }
      }
    });
  }
} catch (e) {
  console.warn('Failed to manually parse .env file:', e);
}

console.log('--- DATABASE DIAGNOSTICS ---');
console.log('cwd:', process.cwd());
console.log('process.env.DATABASE_URL raw:', process.env.DATABASE_URL);
console.log('-----------------------------');

const prisma = new PrismaClient();






async function main() {
  const email = 'rep@campusvoice.edu';
  const existingRep = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingRep) {
    const passwordHash = await bcrypt.hash('AdminRepresentative2026!', 10);
    await prisma.user.create({
      data: {
        email,
        name: 'Student Representative',
        passwordHash,
        role: 'REPRESENTATIVE',
        isApproved: true,
      },
    });
    console.log('Seeded Student Representative account successfully.');
  } else {
    console.log('Student Representative account already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
