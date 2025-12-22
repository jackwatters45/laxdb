import { type Config, defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/**/*.sql.ts', './src/**/*.view.ts'],
  out: './migrations',
  dbCredentials: {
    ssl: 'require',
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
}) satisfies Config;
