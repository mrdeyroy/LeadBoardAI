import mongoose from 'mongoose'

import { connectDB } from './config/db.js'
import { env } from './config/env.js'
import { startFollowUpScheduler, stopFollowUpScheduler } from './services/schedulerService.js'
import app from './app.js'

async function shutdown(signal, server) {
  console.log(`[api] received ${signal}, shutting down`)
  stopFollowUpScheduler()
  const force = setTimeout(() => process.exit(1), 8000)
  force.unref()

  try {
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
    if (globalThis.__LEADBOARD_MONGOD) {
      await globalThis.__LEADBOARD_MONGOD.stop()
    }
    console.log('[api] shutdown complete')
    process.exit(0)
  } catch (err) {
    console.error('[api] shutdown error:', err)
    process.exit(1)
  }
}

async function main() {
  const server = app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`)
  })

  await connectDB()
  startFollowUpScheduler()

  const handle = (signal) => shutdown(signal, server)
  process.on('SIGTERM', handle)
  process.on('SIGINT', handle)
}

main().catch((err) => {
  console.error('[api] failed to start:', err)
  process.exit(1)
})