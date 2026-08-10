import { Router } from 'express'

import {
  createFollowUp,
  deleteFollowUp,
  listFollowUps,
  updateFollowUp,
} from '../controllers/followups.js'
import { requireAuth } from '../middleware/auth.js'
import { trimFields, validateBody } from '../utils/validate.js'

const router = Router()

router.use(requireAuth)

const updateSchema = {
  title: { max: 200 },
  dueDate: { type: 'date' },
  completed: { type: 'boolean' },
}

const createSchema = {
  ...updateSchema,
  leadId: { required: true, type: 'objectId' },
  title: { required: true, max: 200 },
  dueDate: { required: true, type: 'date' },
}

router.get('/', listFollowUps)
router.post('/', validateBody(createSchema), createFollowUp)
router.patch('/:id', validateBody(updateSchema), updateFollowUp)
router.delete('/:id', deleteFollowUp)

export default router