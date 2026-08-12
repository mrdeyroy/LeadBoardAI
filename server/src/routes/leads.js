import { Router } from 'express'

import {
  createLead,
  deleteLead,
  exportLeads,
  getLead,
  importLeads,
  listLeads,
  updateLead,
} from '../controllers/leads.js'
import { requireAuth } from '../middleware/auth.js'
import { LEAD_STATUSES, OUTREACH_CHANNELS, WEBSITE_STATUSES } from '../models/Lead.js'
import { EMAIL_PATTERN, trimFields, validateBody } from '../utils/validate.js'

const router = Router()

router.use(requireAuth)

const updateSchema = {
  name: { max: 200 },
  company: { max: 200 },
  email: { pattern: EMAIL_PATTERN },
  phone: { max: 50 },
  source: { max: 100 },
  requirement: { max: 2000 },
  budget: { max: 100 },
  timeline: { max: 100 },
  status: { enum: LEAD_STATUSES, trim: true },
  notes: { max: 5000 },
  contactPerson: { max: 200 },
  website: { max: 500 },
  industry: { max: 100 },
  websiteStatus: { enum: WEBSITE_STATUSES, trim: true },
  outreachChannel: { enum: OUTREACH_CHANNELS, trim: true },
  lastContactedAt: { type: 'isoDate' },
  nextFollowUpAt: { type: 'isoDate' },
}

const createSchema = {
  ...updateSchema,
  name: { required: true, max: 200 },
}

const bodyFields = Object.keys(updateSchema)

router.get('/', listLeads)
router.get('/export', exportLeads)
router.post('/import', importLeads)
router.post('/', trimFields(bodyFields), validateBody(createSchema), createLead)
router.get('/:id', getLead)
router.patch('/:id', trimFields(bodyFields), validateBody(updateSchema), updateLead)
router.delete('/:id', deleteLead)

export default router