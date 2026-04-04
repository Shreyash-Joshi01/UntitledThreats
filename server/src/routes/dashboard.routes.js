import express from 'express'
import { getDashboardSummary } from '../controllers/dashboard.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/summary', requireAuth, getDashboardSummary)

export default router
