import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getActivePolicy, createPolicy, renewPolicy } from '../controllers/policy.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/active', getActivePolicy)
router.post('/create', createPolicy)
router.post('/renew', renewPolicy)

export default router
