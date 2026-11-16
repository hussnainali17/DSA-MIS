import Student from '../models/Student.js'
import Registration from '../models/Registration.js'
import AuditLog from '../models/AuditLog.js'
import { notFound, conflict } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/admin/students
export const listStudents = asyncHandler(async (req, res) => {
  const { q = '', page = 1, limit = 50 } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50))
  const skip = (pageNum - 1) * limitNum

  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { regNo: { $regex: q, $options: 'i' } },
          { department: { $regex: q, $options: 'i' } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Student.countDocuments(filter),
  ])

  res.json({ ok: true, items, total, page: pageNum, limit: limitNum })
})

// POST /api/admin/students
export const createStudent = asyncHandler(async (req, res) => {
  try {
    const student = await Student.create(req.body)
    await AuditLog.create({
      admin: req.admin._id,
      adminName: req.admin.name,
      action: 'student.create',
      target: student.id,
      meta: { name: student.name, regNo: student.regNo },
      ip: req.ip,
    })
    res.status(201).json({ ok: true, student: student.toJSON() })
  } catch (err) {
    if (err.code === 11000) throw conflict('A student with this registration number already exists.')
    throw err
  }
})

// PATCH /api/admin/students/:id
export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
  if (!student) throw notFound('Student not found.')
  try {
    Object.assign(student, req.body)
    await student.save()
    res.json({ ok: true, student: student.toJSON() })
  } catch (err) {
    if (err.code === 11000) throw conflict('A student with this registration number already exists.')
    throw err
  }
})

// DELETE /api/admin/students/:id
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
  if (!student) throw notFound('Student not found.')
  await Registration.deleteMany({ student: student._id })
  await Student.deleteOne({ _id: student._id })
  await AuditLog.create({
    admin: req.admin._id,
    adminName: req.admin.name,
    action: 'student.delete',
    target: student.id,
    meta: { name: student.name, regNo: student.regNo },
    ip: req.ip,
  })
  res.json({ ok: true })
})
