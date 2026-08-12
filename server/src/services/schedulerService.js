import FollowUp from '../models/FollowUp.js'
import { notificationService } from './notificationService.js'

export async function processScheduledFollowUps() {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const pendingFollowUps = await FollowUp.find({ completed: false })
    .populate('lead', 'name company')

  let processedCount = 0

  for (const fup of pendingFollowUps) {
    if (!fup.lead) continue

    const leadName = fup.lead.name || 'Lead'
    const dateStr = new Date(fup.dueDate).toISOString().split('T')[0]

    if (fup.dueDate < startOfDay) {
      // Overdue
      const dedupKey = `overdue_${fup._id}_${dateStr}`
      await notificationService.sendNotification({
        user: fup.user,
        lead: fup.lead._id,
        followUp: fup._id,
        type: 'followup_overdue',
        title: `Overdue Follow-up: ${fup.title}`,
        message: `Follow-up "${fup.title}" for ${leadName} was due on ${fup.dueDate.toLocaleDateString()}.`,
        dedupKey,
      })
      processedCount++
    } else if (fup.dueDate >= startOfDay && fup.dueDate <= endOfDay) {
      // Due Today
      const dedupKey = `due_${fup._id}_${dateStr}`
      await notificationService.sendNotification({
        user: fup.user,
        lead: fup.lead._id,
        followUp: fup._id,
        type: 'followup_due',
        title: `Follow-up Due Today: ${fup.title}`,
        message: `Reminder: Follow-up "${fup.title}" for ${leadName} is scheduled for today.`,
        dedupKey,
      })
      processedCount++
    }
  }

  return { processedCount }
}

let schedulerTimer = null

export function startFollowUpScheduler(intervalMs = 60000) {
  if (schedulerTimer) return

  // Run once on startup
  processScheduledFollowUps().catch((err) =>
    console.error('[scheduler] Follow-up check error:', err.message)
  )

  schedulerTimer = setInterval(() => {
    processScheduledFollowUps().catch((err) =>
      console.error('[scheduler] Follow-up check error:', err.message)
    )
  }, intervalMs)

  if (schedulerTimer.unref) schedulerTimer.unref()
}

export function stopFollowUpScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
}
