import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { notificationService } from '../services/notificationService.js'

export const getNotifications = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 20
  const unreadOnly = req.query.unreadOnly === 'true'

  const data = await notificationService.getNotifications(req.user.id, {
    limit: Number.isNaN(limit) ? 20 : limit,
    unreadOnly,
  })

  res.json(data)
})

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updated = await notificationService.markAsRead(req.user.id, id)
  
  if (!updated) {
    throw new ApiError(404, 'Notification not found')
  }

  res.json({ notification: updated })
})

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id)
  res.json({ message: 'All notifications marked as read' })
})
