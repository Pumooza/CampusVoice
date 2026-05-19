import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Manually load .env variables for Next.js server environment reliability
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

// Defensive check for "undefined" or "null" literal strings
const envUrl = process.env.DATABASE_URL;
let connectionString = (envUrl && envUrl !== 'undefined' && envUrl !== 'null') ? envUrl : 'file:./dev.db';

// Resolve relative file paths to absolute paths relative to project root directory
if (connectionString.startsWith('file:')) {
  const relativePath = connectionString.substring(5);
  if (!path.isAbsolute(relativePath)) {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    connectionString = `file:${absolutePath}`;
  }
}


const adapter = new PrismaLibSql({
  url: connectionString,
});




const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };


