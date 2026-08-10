import cors from 'cors'
import express from 'express'

import { clerkAuth } from './config/clerk.js'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/logger.js'
import authRouter from './routes/auth.js'
import activitiesRouter from './routes/activities.js'
import aiRouter from './routes/ai.js'
import dashboardRouter from './routes/dashboard.js'
import followUpsRouter from './routes/followups.js'
import healthRouter from './routes/health.js'
import leadsRouter from './routes/leads.js'
import userRouter from './routes/user.js'

const app = express()

app.use(clerkAuth())
app.use(requestLogger)

app.use(
  cors({
    origin: env.clientUrl,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use(express.json({ limit: '1mb' }))

app.get('/', (req, res) => {
  res.json({ service: 'LeadBoard AI API', version: '0.1.0' })
})

app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/api/leads', leadsRouter)
app.use('/api', activitiesRouter)
app.use('/api/followups', followUpsRouter)
app.use('/api', dashboardRouter)
app.use('/api/ai', aiRouter)

app.use(notFound)
app.use(errorHandler)

export default app