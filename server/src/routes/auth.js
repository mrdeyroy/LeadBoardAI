import { Router } from 'express'

import { me } from '../controllers/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()

// Clerk owns sign-up/sign-in/sign-out. The only remaining auth endpoint
// is an application-user sync/profile read, guarded like every other route.
router.get(
  '/me',
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 30, name: 'auth' }),
  me
)

export default router