import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Admin client for database operations — always uses service role (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Separate client for auth operations — keeps its own auth state
// so signInWithPassword/signInWithOtp/verifyOtp don't pollute
// the admin client's context and break RLS bypass for DB queries.
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default supabase
export { supabaseAuth }
