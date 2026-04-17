import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { createOrder, initiatePayout, verifyPayout } from '../controllers/payout.controller.js'

const router = Router()

router.use(requireAuth)
router.post('/create-order', createOrder)
router.post('/initiate', initiatePayout)
router.post('/verify', verifyPayout)

export default router
