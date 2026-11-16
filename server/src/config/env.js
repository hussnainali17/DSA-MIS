import 'dotenv/config'
import { z } from 'zod'

// In test mode, allow MONGODB_URI to be empty at import time (tests set it before connecting)
const isTest = process.env.NODE_ENV === 'test'

const schema = z.object({
  MONGODB_URI: isTest
    ? z.string().optional().default('')
    : z.string().min(1, 'MONGODB_URI is required'),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z.string().transform((v) => v === 'true').default('false'),
  SEED_ADMIN_USERNAME: z.string().min(3).default('admin'),
  SEED_ADMIN_PASSWORD: z.string().optional().default(''),
  SEED_ADMIN_NAME: z.string().default('DSA Administrator'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n')
  console.error('[config] Environment validation failed:\n' + issues)
  console.error('[config] Copy .env.example to .env and fill in the required values.')
  process.exit(1)
}

const env = parsed.data

// Extra production check
if (env.NODE_ENV === 'production' && !env.COOKIE_SECURE) {
  console.error('[config] COOKIE_SECURE must be true in production.')
  process.exit(1)
}

export default env
