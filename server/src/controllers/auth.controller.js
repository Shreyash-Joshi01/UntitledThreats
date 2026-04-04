import { supabaseAuth } from '../config/supabase.js'
import { ok, fail } from '../utils/response.js'

// Register — create account then send OTP via Magic Link template
export async function register(req, res) {
  const { email, password } = req.body
  if (!email || !password) return fail(res, 400, 'Email and password are required')

  try {
    // 1. Create the account (does NOT require email confirmation yet)
    const { error: signUpError } = await supabaseAuth.auth.signUp({ email, password })
    if (signUpError && !signUpError.message.toLowerCase().includes('already registered')) {
      return fail(res, 400, signUpError.message)
    }

    // 2. Fire the Magic Link email template (which user customised with {{ .Token }})
    //    This is what puts the 6-digit OTP in the user's inbox
    const { error: otpError } = await supabaseAuth.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    })
    if (otpError) return fail(res, 500, 'Failed to send OTP: ' + otpError.message)

    ok(res, { message: 'OTP sent to ' + email + '. Check your inbox.' })
  } catch (err) {
    return fail(res, 500, 'Registration failed: ' + err.message)
  }
}

// Login — email + password only, returns session immediately
export async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) return fail(res, 400, 'Email and password are required')

  try {
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return fail(res, 401, authError?.message || 'Invalid email or password')
    }

    if (!authData.session) {
      return fail(res, 401, 'Login succeeded but no session was created.')
    }

    ok(res, {
      message: 'Login successful.',
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      user: authData.user
    })
  } catch (err) {
    return fail(res, 500, 'Login failed: ' + err.message)
  }
}

// Verify email OTP (register only) → returns session
export async function verifyOTP(req, res) {
  const { email, token } = req.body
  if (!email || !token) return fail(res, 400, 'Email and OTP token are required')

  try {
    const { data, error } = await supabaseAuth.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) return fail(res, 401, error.message)
    if (!data.session) return fail(res, 401, 'OTP verified but no session was created.')

    ok(res, {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user
    })
  } catch (err) {
    return fail(res, 500, 'OTP verification failed: ' + err.message)
  }
}
