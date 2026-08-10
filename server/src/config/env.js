import dotenv from 'dotenv'

dotenv.config()

const parsePort = (value, fallback) => {
  const port = Number.parseInt(value, 10)
  return Number.isInteger(port) && port > 0 ? port : fallback
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT, 5000),
  mongoUri:
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leadboard',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
}

if (env.nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production')
}