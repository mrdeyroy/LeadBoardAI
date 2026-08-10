import { Router } from 'express'

import { getDBStatus } from '../config/db.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'leadboard-ai-server',
    db: getDBStatus(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

export default router