import express from 'express'
import { reverseGeocode } from '../controllers/geocode.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/reverse', requireAuth, reverseGeocode)

export default router
