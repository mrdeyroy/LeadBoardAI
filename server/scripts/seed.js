import mongoose from 'mongoose'

import { connectDB } from '../src/config/db.js'
import {
  DEMO_CREDENTIALS,
  seedDemoData,
} from '../src/seed/demoData.js'

async function main() {
  await connectDB()

  const counts = await seedDemoData()

  console.log(`Seeded ${counts.leads} leads, ${counts.followUps} follow-ups, ${counts.activities} activities`)
  console.log(`Log in with ${DEMO_CREDENTIALS.email} / ${DEMO_CREDENTIALS.password}`)

  await mongoose.disconnect()
  if (globalThis.__LEADBOARD_MONGOD) {
    await globalThis.__LEADBOARD_MONGOD.stop()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})