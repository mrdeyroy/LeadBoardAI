import mongoose from 'mongoose'

import { connectDB } from '../src/config/db.js'
import { DEMO_CLERK_USER_ID, seedDemoData } from '../src/seed/demoData.js'

async function main() {
  await connectDB()

  const seeded = await seedDemoData()

  console.log(`Successfully seeded demo data for ${seeded.length} account(s):`)
  for (const item of seeded) {
    console.log(` - Account: ${item.user} (${item.leads} leads, ${item.followUps} follow-ups, ${item.activities} activities)`)
  }

  await mongoose.disconnect()
  if (globalThis.__LEADBOARD_MONGOD) {
    await globalThis.__LEADBOARD_MONGOD.stop()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})