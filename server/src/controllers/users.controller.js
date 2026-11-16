import bcrypt from 'bcryptjs'
import AdminUser from '../models/AdminUser.js'
import AuditLog from '../models/AuditLog.js'
import { notFound, conflict, forbidden } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/admin/users  — superadmin only
export const listUsers = asyncHandler(async (req, res) => {
  const users = await AdminUser.find().sort({ createdAt: -1 }).lean()
  res.json({ ok: true, items: users })
})

// POST /api/admin/users  — superadmin only
export const createUser = asyncHandler(async (req, res) => {
  const { username, name, password, role } = req.body
  const passwordHash = await bcrypt.hash(password, 12)
  try {
    const user = await AdminUser.create({ username, name, passwordHash, role })
    await AuditLog.create({
      admin: req.admin._id,
      adminName: req.admin.name,
      action: 'user.create',
      target: user.id,
      meta: { username: user.username, role: user.role },
      ip: req.ip,
    })
    res.status(201).json({ ok: true, user: user.toJSON() })
  } catch (err) {
    if (err.code === 11000) throw conflict('A user with this username already exists.')
    throw err
  }
})

// PATCH /api/admin/users/:id  — superadmin only
export const updateUser = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id)
  if (!user) throw notFound('User not found.')
  const { name, active, password, role } = req.body
  if (name !== undefined) user.name = name
  if (active !== undefined) user.active = active
  if (role !== undefined) user.role = role
  if (password) user.passwordHash = await bcrypt.hash(password, 12)
  await user.save()
  res.json({ ok: true, user: user.toJSON() })
})

// DELETE /api/admin/users/:id  — superadmin only; cannot delete yourself
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.admin._id.toString()) {
    throw forbidden('You cannot delete your own account.')
  }
  const user = await AdminUser.findById(req.params.id)
  if (!user) throw notFound('User not found.')
  await AdminUser.deleteOne({ _id: user._id })
  await AuditLog.create({
    admin: req.admin._id,
    adminName: req.admin.name,
    action: 'user.delete',
    target: user.id,
    meta: { username: user.username },
    ip: req.ip,
  })
  res.json({ ok: true })
})
