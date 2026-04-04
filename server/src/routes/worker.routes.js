import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getMe, registerWorker, updateZone } from '../controllers/worker.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/me', getMe)
router.post('/register', registerWorker)
router.patch('/zone', updateZone)

export default router
