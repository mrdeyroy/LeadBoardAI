import { Router } from 'express'

import {
  analyze,
  chat,
  qualify,
  reply,
  runAction,
  timing,
} from '../controllers/ai.js'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { validateBody } from '../utils/validate.js'

const router = Router()

router.use(requireAuth)
router.use(rateLimit({ windowMs: 60_000, max: 30, name: 'ai' }))

const leadIdRule = { required: true, type: 'objectId' }

router.post('/analyze', validateBody({ leadId: leadIdRule }), analyze)
router.post(
  '/reply',
  validateBody({
    leadId: leadIdRule,
    tone: { enum: ['short', 'professional', 'friendly'], trim: true },
  }),
  reply
)
router.post('/qualify', validateBody({ leadId: leadIdRule }), qualify)
router.post('/timing', validateBody({ leadId: leadIdRule }), timing)
router.post(
  '/chat',
  validateBody({ leadId: leadIdRule, message: { required: true, max: 2000 } }),
  chat
)
router.post('/actions', runAction)

export default router