import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import AdminUser from '../models/AdminUser.js'
import { unauthorized, forbidden } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * Middleware: require a valid admin JWT cookie.
 * Attaches req.admin to the request.
 */
export const requireAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token
  if (!token) throw unauthorized()

  let payload
  try {
    payload = jwt.verify(token, env.JWT_SECRET)
  } catch {
    throw unauthorized('Session expired or invalid. Please sign in again.')
  }

  const admin = await AdminUser.findById(payload.id).select('+passwordHash')
  if (!admin || !admin.active) throw unauthorized('Account not found or deactivated.')

  req.admin = admin
  next()
})

/**
 * Middleware: require superadmin role.
 * Must be used after requireAdmin.
 */
export const requireSuperadmin = (req, res, next) => {
  if (req.admin?.role !== 'superadmin') throw forbidden('Superadmin access required.')
  next()
}
