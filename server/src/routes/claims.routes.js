import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getClaims, getClaimById, appealClaim } from '../controllers/claims.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/', getClaims)
router.get('/:id', getClaimById)
router.post('/:id/appeal', appealClaim)

export default router
