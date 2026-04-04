import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { calculatePremium } from '../controllers/premium.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/calculate', calculatePremium)

export default router
