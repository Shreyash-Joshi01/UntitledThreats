import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getActiveTriggers } from '../controllers/triggers.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/active', getActiveTriggers)

export default router
