import supabase from '../config/supabase.js'

/**
 * Create a WhatsApp-style notification for a worker.
 * Called after a claim is auto-approved or flagged by the system.
 */
export async function createNotification({ worker_id, type = 'whatsapp', event_type, title, body, amount_inr = null, claim_id = null }) {
  try {
    const { error } = await supabase.from('notifications').insert({
      worker_id,
      type,
      event_type,
      title,
      body,
      amount_inr,
      claim_id,
    })
    if (error) console.warn('[notifications] insert failed:', error.message)
  } catch (err) {
    console.warn('[notifications] error:', err.message)
  }
}

/**
 * Fetch the latest notifications for a worker (last 10, last 7 days).
 */
export async function getWorkerNotifications(worker_id) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('worker_id', worker_id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10)
  return data || []
}
