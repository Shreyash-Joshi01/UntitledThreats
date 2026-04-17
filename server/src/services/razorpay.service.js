import Razorpay from 'razorpay'
import crypto from 'crypto'

const client = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

/**
 * Creates a Razorpay order for a claim payout.
 * @param {string} workerId
 * @param {number} amountInr - Amount in ₹
 * @param {string} claimId
 * @returns {Promise<object>} Razorpay order object
 */
export async function createPayoutOrder(workerId, amountInr, claimId) {
  const amountPaise = Math.round(amountInr * 100)
  const receipt = `clm_${claimId.slice(0, 12)}_${Date.now().toString().slice(-6)}`

  const order = await client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: {
      worker_id: workerId,
      claim_id: claimId,
      payout_type: 'weather_disruption_compensation',
    },
  })

  return order
}

/**
 * Simulates a UPI payout in test mode (no real money moves).
 * In production this would use Razorpay Payouts API with IMPS/UPI.
 */
export async function simulateUpiPayout(workerUpiId, amountInr, claimId, workerId) {
  const order = await createPayoutOrder(workerId, amountInr, claimId)

  return {
    status: 'SIMULATED_SUCCESS',
    order_id: order.id,
    amount_inr: amountInr,
    upi_id: workerUpiId,
    claim_id: claimId,
    mode: 'TEST',
    message: 'Payout simulated via Razorpay Test Mode. No real money transferred.',
  }
}

/**
 * Verifies the Razorpay payment signature from the checkout callback.
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

export const RAZORPAY_KEY_ID = () => process.env.RAZORPAY_KEY_ID
