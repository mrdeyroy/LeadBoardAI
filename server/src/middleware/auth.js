import { getAuth } from '@clerk/express'

import { env } from '../config/env.js'
import { findOrCreateAppUser } from '../services/userSync.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Protect a route with Clerk authentication.
 * Fails closed: without configured Clerk keys every request is rejected,
 * so the app can never run with authentication silently disabled.
 */
export async function requireAuth(req, _res, next) {
  if (!env.clerkSecretKey) {
    throw new ApiError(401, 'Authentication required')
  }

  const auth = getAuth(req)
  if (!auth.isAuthenticated || !auth.userId) {
    throw new ApiError(401, 'Authentication required')
  }

  try {
    req.user = await findOrCreateAppUser(auth.userId, auth.sessionClaims)
    next()
  } catch {
    next(new ApiError(500, 'Could not resolve your account'))
  }
}