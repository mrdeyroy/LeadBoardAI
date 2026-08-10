import User from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) throw new ApiError(404, 'User not found')
  res.json({ user: user.toJSON() })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) throw new ApiError(404, 'User not found')

  const { name, phone, jobTitle, companyName, bio } = req.body

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new ApiError(400, 'Name is required')
    }
    user.name = name.trim().slice(0, 100)
  }

  if (phone !== undefined) {
    user.phone = typeof phone === 'string' ? phone.trim().slice(0, 50) : ''
  }

  if (jobTitle !== undefined) {
    user.jobTitle = typeof jobTitle === 'string' ? jobTitle.trim().slice(0, 100) : ''
  }

  if (companyName !== undefined) {
    user.companyName = typeof companyName === 'string' ? companyName.trim().slice(0, 100) : ''
  }

  if (bio !== undefined) {
    user.bio = typeof bio === 'string' ? bio.trim().slice(0, 500) : ''
  }

  await user.save()
  res.json({ user: user.toJSON() })
})

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) throw new ApiError(404, 'User not found')

  const { itemsPerPage, defaultView, theme } = req.body

  if (!user.preferences) {
    user.preferences = { itemsPerPage: 20, defaultView: 'table', theme: 'system' }
  }

  if (itemsPerPage !== undefined) {
    const num = Number.parseInt(itemsPerPage, 10)
    if ([10, 20, 50].includes(num)) {
      user.preferences.itemsPerPage = num
    } else {
      throw new ApiError(400, 'itemsPerPage must be 10, 20, or 50')
    }
  }

  if (defaultView !== undefined) {
    if (['table', 'cards'].includes(defaultView)) {
      user.preferences.defaultView = defaultView
    } else {
      throw new ApiError(400, 'defaultView must be table or cards')
    }
  }

  if (theme !== undefined) {
    if (['light', 'dark', 'system'].includes(theme)) {
      user.preferences.theme = theme
    } else {
      throw new ApiError(400, 'theme must be light, dark, or system')
    }
  }

  await user.save()
  res.json({ user: user.toJSON() })
})
