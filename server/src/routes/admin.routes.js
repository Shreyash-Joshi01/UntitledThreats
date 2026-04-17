import express from 'express'
import { getAdminDashboard, simulateFraud, simulatePremium, simulateRisk } from '../controllers/admin.controller.js'

const router = express.Router()

// GET /api/admin/dashboard
router.get('/dashboard', getAdminDashboard)

// ML Simulation Proxy Routes
router.post('/simulate/fraud', simulateFraud)
router.post('/simulate/premium', simulatePremium)
router.post('/simulate/risk', simulateRisk)

export default router
