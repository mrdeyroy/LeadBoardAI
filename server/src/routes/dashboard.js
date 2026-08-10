import { Router } from 'express'

import { getDashboard } from '../controllers/dashboard.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/dashboard', requireAuth, getDashboard)

export default router