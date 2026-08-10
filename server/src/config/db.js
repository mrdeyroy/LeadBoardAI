import mongoose from 'mongoose'

import { env } from './env.js'
import { seedDemoData } from '../seed/demoData.js'

mongoose.connection.on('connected', () => {
  console.log(`[db] connected to ${mongoose.connection.name}`)
})

mongoose.connection.on('error', (err) => {
  console.error('[db] connection error:', err.message)
})

/**
 * In development, if the configured MongoDB is unreachable we boot an
 * in-memory MongoDB (mongodb-memory-server) so `npm run dev` works with
 * zero setup. Production always requires a real MONGODB_URI.
 */
async function fallbackToMemory(originalError) {
  if (env.nodeEnv === 'production') {
    throw new Error(
      `Could not connect to MongoDB at ${env.mongoUri}. Set MONGODB_URI. (${originalError.message})`
    )
  }
  console.warn(`[db] ${env.mongoUri} is unreachable (${originalError.message})`)
  console.warn('[db] starting an in-memory MongoDB — data will not persist across restarts')

  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const mongod = await MongoMemoryServer.create()
  // Keep the server instance referenced for the lifetime of the process.
  globalThis.__LEADBOARD_MONGOD = mongod

  const uri = mongod.getUri('leadboard')
  console.warn(`[db] in-memory MongoDB at ${uri}`)
  return uri
}

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 3000 })
  } catch (err) {
    const uri = await fallbackToMemory(err)
    await mongoose.connect(uri)

    try {
      const counts = await seedDemoData()
      console.log(
        `[db] demo data ready (${counts.leads} leads) — sign in via Clerk to use the app`
      )
    } catch (seedErr) {
      console.warn('[db] demo seeding skipped:', seedErr.message)
    }
  }
}

export function getDBStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  return states[mongoose.connection.readyState] ?? 'unknown'
}