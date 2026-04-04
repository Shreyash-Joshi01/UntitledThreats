export function errorMiddleware(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack)
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  })
}
