export const ok = (res, data) => res.json({ success: true, data })
export const fail = (res, status, error) => res.status(status).json({ success: false, error })
