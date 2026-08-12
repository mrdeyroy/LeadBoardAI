import mongoose from 'mongoose'

import { connectDB } from '../src/config/db.js'
import { DEMO_CLERK_USER_ID, seedDemoData } from '../src/seed/demoData.js'

async function main() {
  await connectDB()

  const counts = await seedDemoData()

  console.log(`Seeded ${counts.leads} leads, ${counts.followUps} follow-ups, ${counts.activities} activities`)
  console.log(`Owned by Clerk user ${DEMO_CLERK_USER_ID} — sign in with that Clerk account to see it.`)

  await mongoose.disconnect()
  if (globalThis.__LEADBOARD_MONGOD) {
    await globalThis.__LEADBOARD_MONGOD.stop()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})