import mongoose from 'mongoose'

import { connectDB } from '../src/config/db.js'
import User from '../src/models/User.js'
import { seedDemoDataForUser, seedDemoData } from '../src/seed/demoData.js'

async function main() {
  await connectDB()

  const targetEmail = process.argv[2] || process.env.TARGET_EMAIL || 'shibamdeyroy2860@gmail.com'

  let targetUser = await User.findOne({ email: targetEmail.toLowerCase().trim() })
  if (!targetUser) {
    targetUser = await User.findOne({ clerkUserId: targetEmail })
  }

  let counts
  if (targetUser) {
    counts = await seedDemoDataForUser(targetUser)
    console.log(`Seeded demo data directly for user "${targetUser.email || targetUser.name}" (${targetUser._id})`)
  } else {
    counts = await seedDemoData()
    console.log(`No user found with email/id "${targetEmail}". Created default fallback demo user (${counts.user}).`)
  }

  console.log(`Seeded ${counts.leads} leads, ${counts.followUps} follow-ups, ${counts.activities} activities.`)

  await mongoose.disconnect()
  if (globalThis.__LEADBOARD_MONGOD) {
    await globalThis.__LEADBOARD_MONGOD.stop()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})