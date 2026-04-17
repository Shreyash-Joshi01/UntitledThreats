import express from 'express'
import { getAdminDashboard } from '../controllers/admin.controller.js'

const router = express.Router()

// GET /api/admin/dashboard
router.get('/dashboard', getAdminDashboard)

export default router
