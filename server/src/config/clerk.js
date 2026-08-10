import { clerkMiddleware } from '@clerk/express'

import { env } from './env.js'

/**
 * Mount Clerk's authentication middleware, or a no-op when no Clerk keys
 * are configured. `requireAuth` fails closed in that case, so the API can
 * never run with authentication silently disabled.
 */
export function clerkAuth() {
  if (!env.clerkSecretKey || !env.clerkPublishableKey) {
    return (req, _res, next) => next()
  }
  return clerkMiddleware({
    secretKey: env.clerkSecretKey,
    publishableKey: env.clerkPublishableKey,
    jwtKey: env.clerkJwtKey || undefined,
  })
}