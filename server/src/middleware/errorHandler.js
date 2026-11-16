import { ApiError } from '../utils/apiError.js'
import env from '../config/env.js'

/**
 * Central error handler — must have 4 arguments for Express to recognise it.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  // Log the real error (but never the connection string or passwords)
  if (env.NODE_ENV !== 'test') {
    console.error(`[error] ${req.method} ${req.path} →`, err.message)
    if (!(err instanceof ApiError)) console.error(err.stack)
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: err.message,
      ...(err.details?.length ? { details: err.details } : {}),
    })
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
    return res.status(422).json({ ok: false, error: 'Validation failed.', details })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ ok: false, error: 'A record with that value already exists.' })
  }

  // Mongoose cast error (bad ObjectId etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ ok: false, error: 'Invalid ID format.' })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ ok: false, error: 'Session expired or invalid.' })
  }

  // Default 500 — never leak internals to the client
  return res.status(500).json({ ok: false, error: 'An unexpected error occurred.' })
}
