import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * Application-user profile / sync endpoint.
 * `requireAuth` has already verified the Clerk session and synced the
 * application User, so this simply returns that record.
 */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toJSON() })
})