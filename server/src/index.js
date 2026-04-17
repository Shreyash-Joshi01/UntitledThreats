import express from 'express'
import { corsMiddleware } from './middleware/cors.middleware.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import authRoutes from './routes/auth.routes.js'
import workerRoutes from './routes/worker.routes.js'
import policyRoutes from './routes/policy.routes.js'
import premiumRoutes from './routes/premium.routes.js'
import claimsRoutes from './routes/claims.routes.js'
import triggersRoutes from './routes/triggers.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import geocodeRoutes from './routes/geocode.routes.js'
import payoutRoutes from './routes/payout.routes.js'
import adminRoutes from './routes/admin.routes.js'

const app = express()

app.use(corsMiddleware)
app.use(express.json())

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/api/auth', authRoutes)
app.use('/api/worker', workerRoutes)
app.use('/api/policy', policyRoutes)
app.use('/api/premium', premiumRoutes)
app.use('/api/claims', claimsRoutes)
app.use('/api/triggers', triggersRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/geocode', geocodeRoutes)
app.use('/api/payout', payoutRoutes)
app.use('/api/admin', adminRoutes)

app.use(errorMiddleware)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 Untitled Threats server running on port ${PORT}`)
})
