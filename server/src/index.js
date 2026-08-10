import { connectDB } from './config/db.js'
import { env } from './config/env.js'
import app from './app.js'

async function main() {
  app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`)
  })

  await connectDB()

  if (env.nodeEnv === 'production') {
    const handle = (signal) => {
      console.log(`[api] received ${signal}, shutting down`)
      process.exit(0)
    }
    process.on('SIGTERM', handle)
    process.on('SIGINT', handle)
  }
}

main().catch((err) => {
  console.error('[api] failed to start:', err)
  process.exit(1)
})