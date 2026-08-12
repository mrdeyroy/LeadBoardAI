import Notification from '../models/Notification.js'

class NotificationService {
  constructor() {
    this.emailProvider = null
  }

  setEmailProvider(provider) {
    this.emailProvider = provider
  }

  async sendNotification({ user, lead = null, followUp = null, type, title, message, dedupKey = null }) {
    let notification = null

    if (dedupKey) {
      const existing = await Notification.findOne({ dedupKey })
      if (existing) {
        return existing
      }
    }

    try {
      notification = await Notification.create({
        user,
        lead,
        followUp,
        type,
        title,
        message,
        dedupKey: dedupKey || undefined,
      })
    } catch (err) {
      if (err.code === 11000 && dedupKey) {
        return await Notification.findOne({ dedupKey })
      }
      throw err
    }

    if (this.emailProvider && typeof this.emailProvider.sendEmail === 'function') {
      try {
        await this.emailProvider.sendEmail({
          userId: user,
          subject: title,
          body: message,
          type,
        })
      } catch (err) {
        console.error('[NotificationService] Email delivery failed, in-app notification persisted:', err.message)
      }
    }

    return notification
  }

  async getNotifications(userId, { limit = 20, unreadOnly = false } = {}) {
    const query = { user: userId }
    if (unreadOnly) query.read = false

    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('lead', 'name company')
      .populate('followUp', 'title dueDate completed')

    const unreadCount = await Notification.countDocuments({ user: userId, read: false })

    return {
      notifications: items,
      unreadCount,
    }
  }

  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOne({ _id: notificationId, user: userId })
    if (!notification) return null

    if (!notification.read) {
      notification.read = true
      notification.readAt = new Date()
      await notification.save()
    }
    return notification
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    )
    return { success: true }
  }
}

export const notificationService = new NotificationService()
