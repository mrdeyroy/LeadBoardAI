import dotenv from 'dotenv'

dotenv.config()

const parsePort = (value, fallback) => {
  const port = Number.parseInt(value, 10)
  return Number.isInteger(port) && port > 0 ? port : fallback
}

const REQUIRED_IN_PRODUCTION = ['CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY']

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT, 5000),
  mongoUri:
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leadboard',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
  clerkJwtKey: process.env.CLERK_JWT_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
}

if (env.nodeEnv === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`)
  }
}

if (env.clerkSecretKey || env.clerkPublishableKey) {
  if (!env.clerkSecretKey || !env.clerkPublishableKey) {
    throw new Error('CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY must be set together')
  }
}