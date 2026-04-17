import express from 'express'
import { getDashboardSummary, getAdminDashboard } from '../controllers/dashboard.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/summary', requireAuth, getDashboardSummary)
router.get('/admin', requireAuth, getAdminDashboard)

export default router
