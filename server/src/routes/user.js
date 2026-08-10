import { Router } from 'express'
import {
  getProfile,
  updatePreferences,
  updateProfile,
} from '../controllers/user.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.get('/profile', getProfile)
router.patch('/profile', updateProfile)
router.patch('/preferences', updatePreferences)

export default router
