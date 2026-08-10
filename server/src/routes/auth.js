import { Router } from 'express'

import { login, logout, me, register } from '../controllers/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { EMAIL_PATTERN, trimFields, validateBody } from '../utils/validate.js'

const router = Router()

router.post(
  '/register',
  trimFields(['name', 'email']),
  validateBody({
    name: { required: true, max: 100 },
    email: { required: true, pattern: EMAIL_PATTERN, max: 254 },
    password: { required: true, min: 6, max: 128 },
  }),
  register
)

router.post(
  '/login',
  trimFields(['email']),
  validateBody({
    email: { required: true, pattern: EMAIL_PATTERN, max: 254 },
    password: { required: true },
  }),
  login
)

router.post('/logout', logout)

router.get('/me', requireAuth, asyncHandler(me))

export default router