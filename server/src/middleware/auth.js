import { ApiError } from '../utils/ApiError.js'
import { verifyToken } from '../utils/jwt.js'

/**
 * Require a valid `Authorization: Bearer <token>` header.
 * Attaches the authenticated user as `req.user`.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    throw new ApiError(401, 'Authentication required')
  }

  const payload = verifyToken(token)
  req.user = { id: payload.sub, email: payload.email }
  next()
}