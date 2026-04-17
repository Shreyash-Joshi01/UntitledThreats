import supabase from '../config/supabase.js'
import { ok, fail } from '../utils/response.js'
import { createPayoutOrder, simulateUpiPayout, verifyPaymentSignature, RAZORPAY_KEY_ID } from '../services/razorpay.service.js'

/**
 * POST /api/payout/create-order
 * Creates a Razorpay order for an approved claim.
 * Returns order details + public test key for the frontend checkout widget.
 */
export async function createOrder(req, res) {
  try {
    const { data: worker } = await supabase
      .from('workers')
      .select('id')
      .eq('user_id', req.user.id)
      .single()

    if (!worker) return fail(res, 404, 'Worker not found')

    const { claim_id, amount_inr } = req.body
    if (!claim_id || !amount_inr) return fail(res, 400, 'claim_id and amount_inr are required')

    // Verify claim belongs to this worker and is approved
    const { data: claim } = await supabase
      .from('claims')
      .select('id, status, payout_amount, payout_reference')
      .eq('id', claim_id)
      .eq('worker_id', worker.id)
      .single()

    if (!claim) return fail(res, 404, 'Claim not found')
    if (claim.status !== 'auto_approved') return fail(res, 403, 'Only approved claims can be paid out')

    const order = await createPayoutOrder(worker.id, amount_inr, claim_id)

    ok(res, {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpay_key: RAZORPAY_KEY_ID(),
    })
  } catch (err) {
    return fail(res, 500, `Payout order creation failed: ${err.message}`)
  }
}

/**
 * POST /api/payout/initiate
 * Simulates a UPI payout in Razorpay Test Mode.
 */
export async function initiatePayout(req, res) {
  try {
    const { data: worker } = await supabase
      .from('workers')
      .select('id, upi_id')
      .eq('user_id', req.user.id)
      .single()

    if (!worker) return fail(res, 404, 'Worker not found')

    const { claim_id, amount_inr } = req.body
    if (!claim_id || !amount_inr) return fail(res, 400, 'claim_id and amount_inr are required')

    const result = await simulateUpiPayout(worker.upi_id, amount_inr, claim_id, worker.id)

    // Record the Razorpay order reference on the claim
    await supabase
      .from('claims')
      .update({ payout_reference: result.order_id })
      .eq('id', claim_id)
      .eq('worker_id', worker.id)

    ok(res, result)
  } catch (err) {
    return fail(res, 500, `Payout initiation failed: ${err.message}`)
  }
}

/**
 * POST /api/payout/verify
 * Verifies a Razorpay payment signature after checkout success.
 */
export async function verifyPayout(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, claim_id } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return fail(res, 400, 'Missing Razorpay signature fields')
    }

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!isValid) return fail(res, 400, 'Payment signature verification failed')

    // Update claim with final Razorpay payment ID
    if (claim_id) {
      await supabase
        .from('claims')
        .update({ payout_reference: `${razorpay_order_id}|${razorpay_payment_id}` })
        .eq('id', claim_id)
    }

    ok(res, { verified: true, payment_id: razorpay_payment_id })
  } catch (err) {
    return fail(res, 500, `Verification failed: ${err.message}`)
  }
}
