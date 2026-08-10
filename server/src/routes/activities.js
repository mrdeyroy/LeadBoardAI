import { Router } from 'express'

import {
  getLeadActivities,
  listRecentActivities,
} from '../controllers/activities.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/leads/:leadId/activities', getLeadActivities)
router.get('/activities', listRecentActivities)

export default router