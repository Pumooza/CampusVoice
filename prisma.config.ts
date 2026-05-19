import { defineConfig, env } from 'prisma/config';
import fs from 'fs';
import path from 'path';

// Manually load .env variables for Prisma 7 CLI environment compatibility
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

export default defineConfig({
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
});



