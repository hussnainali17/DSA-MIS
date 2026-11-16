import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import AdminUser from '../models/AdminUser.js'
import AuditLog from '../models/AuditLog.js'
import env from '../config/env.js'
import { unauthorized, forbidden } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

const LOCK_MINUTES = 15
const MAX_FAILED = 5

function cookieOptions() {
  // Parse JWT_EXPIRES_IN (e.g., '8h') to milliseconds for maxAge
  const match = env.JWT_EXPIRES_IN.match(/^(\d+)([smhd])$/)
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
  const maxAge = match ? parseInt(match[1]) * (units[match[2]] || 3600000) : 8 * 3600000
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    maxAge,
    path: '/',
  }
}

// POST /api/admin/auth/login
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body
  const WRONG = 'Username or password is incorrect.'

  const user = await AdminUser.findOne({ username: username.toLowerCase() }).select('+passwordHash')
  if (!user) {
    await AuditLog.create({ action: 'auth.login.fail', adminName: username, meta: { reason: 'no-user' }, ip: req.ip })
    throw unauthorized(WRONG)
  }

  if (!user.active) {
    throw unauthorized(WRONG)
  }

  // Brute-force lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw unauthorized('Account is temporarily locked. Please try again later.')
  }

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) {
    const failed = (user.failedLogins || 0) + 1
    const update = { failedLogins: failed }
    if (failed >= MAX_FAILED) update.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000)
    await AdminUser.updateOne({ _id: user._id }, update)
    await AuditLog.create({ admin: user._id, action: 'auth.login.fail', adminName: user.name, meta: { failed }, ip: req.ip })
    throw unauthorized(WRONG)
  }

  // Reset failed count on success
  await AdminUser.updateOne({ _id: user._id }, { failedLogins: 0, lockedUntil: null })

  const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })

  await AuditLog.create({ admin: user._id, action: 'auth.login', adminName: user.name, ip: req.ip })

  res.cookie('token', token, cookieOptions())
  res.json({ ok: true, user: { username: user.username, name: user.name, role: user.role } })
})

// POST /api/admin/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { path: '/' })
  res.json({ ok: true })
})

// GET /api/admin/auth/me
export const me = asyncHandler(async (req, res) => {
  const admin = req.admin
  res.json({ ok: true, user: { username: admin.username, name: admin.name, role: admin.role } })
})
