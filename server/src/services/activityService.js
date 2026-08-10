import Activity from '../models/Activity.js'

/**
 * Record an activity entry for a lead. Failures never break the
 * requesting operation — they are logged and swallowed.
 */
export async function recordActivity({ userId, leadId, type, message, metadata }) {
  try {
    await Activity.create({
      user: userId,
      lead: leadId,
      type,
      message,
      metadata,
    })
  } catch (err) {
    console.error('[activity] failed to record:', err.message)
  }
}

export async function deleteLeadActivity(leadId) {
  try {
    await Activity.deleteMany({ lead: leadId })
  } catch (err) {
    console.error('[activity] cleanup failed:', err.message)
  }
}