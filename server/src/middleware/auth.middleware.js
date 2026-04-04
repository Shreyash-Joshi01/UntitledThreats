import supabase from '../config/supabase.js'
import { fail } from '../utils/response.js'

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1]

  if (!token) {
    return fail(res, 401, 'No token provided')
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return fail(res, 401, 'Invalid or expired token')
  }

  req.user = user
  next()
}
