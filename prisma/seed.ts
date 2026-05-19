import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
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

// Defensive check for "undefined" or "null" literal strings
const envUrl = process.env.DATABASE_URL;
let connectionString = (envUrl && envUrl !== 'undefined' && envUrl !== 'null') ? envUrl : 'file:./dev.db';

console.log('Defensive connectionString:', connectionString);

// Resolve relative file paths to absolute paths relative to project root directory
if (connectionString.startsWith('file:')) {
  const relativePath = connectionString.substring(5);
  if (!path.isAbsolute(relativePath)) {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    connectionString = `file:${absolutePath}`;
  }
}


console.log('Resolved connectionString:', connectionString);
console.log('-----------------------------');

const adapter = new PrismaLibSql({ url: connectionString });
const prisma = new PrismaClient({ adapter });






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
