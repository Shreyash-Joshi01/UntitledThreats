import express from 'express'
import { getAdminDashboard } from '../controllers/admin.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

// GET /api/admin/dashboard
router.get('/dashboard', requireAuth, getAdminDashboard)

export default router
