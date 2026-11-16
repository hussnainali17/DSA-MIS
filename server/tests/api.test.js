/**
 * Integration tests for the DSA backend API.
 * Uses mongodb-memory-server for an isolated in-memory MongoDB.
 * Environment variables are set in tests/setup.js (loaded via jest setupFiles).
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import supertest from 'supertest'
import bcrypt from 'bcryptjs'
import app from '../src/app.js'
import AdminUser from '../src/models/AdminUser.js'
import Society from '../src/models/Society.js'
import Event from '../src/models/Event.js'
import Student from '../src/models/Student.js'
import Registration from '../src/models/Registration.js'
import EventSignup from '../src/models/EventSignup.js'
import SocietyApplication from '../src/models/SocietyApplication.js'
import Complaint from '../src/models/Complaint.js'

let mongod
const request = supertest(app)

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}, 30000)

afterAll(async () => {
  await mongoose.connection.close()
  if (mongod) await mongod.stop()
}, 15000)

afterEach(async () => {
  // Clean up between describe blocks to avoid state leakage
})

// ── Helpers ──
async function createAdmin(role = 'superadmin') {
  const username = `admin_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const hash = await bcrypt.hash('test-password-long!!', 12)
  await AdminUser.create({ username, name: 'Test Admin', passwordHash: hash, role })
  const res = await request.post('/api/admin/auth/login').send({ username, password: 'test-password-long!!' })
  if (res.status !== 200) throw new Error(`createAdmin login failed: ${JSON.stringify(res.body)}`)
  const setCookie = res.headers['set-cookie']
  if (!setCookie) throw new Error(`createAdmin: no set-cookie header in login response`)
  // Return the single token cookie string (first element or the string itself)
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie
  return { cookie, username }
}

async function seedEvent(name) {
  return Event.create({
    name: name || `Event-${Date.now()}`,
    society: 'DSA',
    level: 'University',
    published: true,
    start: new Date('2026-01-01'),
    end: new Date('2026-01-02'),
  })
}

async function seedSociety() {
  const slug = `soc-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return Society.create({ slug, name: `Society ${slug}`, about: 'Test society' })
}

// ─────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────
describe('Health check', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request.get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────
describe('Auth', () => {
  let adminUsername = `authuser_${Date.now()}`

  beforeAll(async () => {
    const hash = await bcrypt.hash('secure-pass-12345!!', 12)
    await AdminUser.create({ username: adminUsername, name: 'Auth Tester', passwordHash: hash, role: 'superadmin' })
  })

  test('login succeeds with correct credentials', async () => {
    const res = await request.post('/api/admin/auth/login').send({ username: adminUsername, password: 'secure-pass-12345!!' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.username).toBe(adminUsername)
    expect(res.headers['set-cookie']).toBeDefined()
  })

  test('login fails with wrong password — same message as wrong username', async () => {
    const res = await request.post('/api/admin/auth/login').send({ username: adminUsername, password: 'wrong-password-here' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Username or password is incorrect.')
  })

  test('login fails with non-existent username', async () => {
    const res = await request.post('/api/admin/auth/login').send({ username: 'nobody-at-all', password: 'whatever-long-pass' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Username or password is incorrect.')
  })

  test('lockout after 5 failed attempts', async () => {
    const lockUsername = `lockuser_${Date.now()}`
    const hash = await bcrypt.hash('correct-pass-1234', 12)
    await AdminUser.create({ username: lockUsername, name: 'Lock Test', passwordHash: hash, role: 'admin', failedLogins: 0 })

    for (let i = 0; i < 5; i++) {
      await request.post('/api/admin/auth/login').send({ username: lockUsername, password: 'wrong-pass' })
    }
    // Now try with correct password — should be locked
    const res = await request.post('/api/admin/auth/login').send({ username: lockUsername, password: 'correct-pass-1234' })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/locked/i)
  })

  test('GET /me returns 401 without cookie', async () => {
    const res = await request.get('/api/admin/auth/me')
    expect(res.status).toBe(401)
  })

  test('GET /me returns user with valid cookie', async () => {
    const loginRes = await request.post('/api/admin/auth/login').send({ username: adminUsername, password: 'secure-pass-12345!!' })
    const cookie = loginRes.headers['set-cookie']
    const res = await request.get('/api/admin/auth/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe(adminUsername)
  })
})

// ─────────────────────────────────────────────────────────
// ADMIN ROUTE PROTECTION
// ─────────────────────────────────────────────────────────
describe('Admin routes require auth', () => {
  const routes = [
    ['GET', '/api/admin/stats'],
    ['GET', '/api/admin/events'],
    ['GET', '/api/admin/students'],
    ['GET', '/api/admin/registrations'],
    ['GET', '/api/admin/event-signups'],
    ['GET', '/api/admin/society-applications'],
    ['GET', '/api/admin/complaints'],
  ]

  test.each(routes)('%s %s returns 401 without cookie', async (method, path) => {
    const res = await request[method.toLowerCase()](path)
    expect(res.status).toBe(401)
  })
})

// ─────────────────────────────────────────────────────────
// PUBLIC EVENT SIGNUPS
// ─────────────────────────────────────────────────────────
describe('Public event signups', () => {
  let eventId

  beforeAll(async () => {
    const ev = await seedEvent('Signup Test Event')
    eventId = ev._id.toString()
  })

  const body = () => ({
    eventId,
    name: 'Test Student',
    regNo: `TST-${Date.now()}`,
    department: 'Computer Science',
    programme: 'BS',
    semester: 3,
    email: 'test@pu.edu.pk',
    phone: '03001234567',
    role: 'Participant',
  })

  test('signup succeeds and returns 201', async () => {
    const b = body()
    const res = await request.post('/api/public/event-signups').send(b)
    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)
  })

  test('signup accepts an international 0092 phone number', async () => {
    const regNo = `TST-INT-${Date.now()}`
    const res = await request.post('/api/public/event-signups').send({
      ...body(),
      regNo,
      phone: '0092 300 1234567',
    })
    expect(res.status).toBe(201)
    const signup = await EventSignup.findOne({ regNo })
    expect(signup.phone).toBe('03001234567')
  })

  test('duplicate regNo + event returns 409', async () => {
    const b = body()
    await request.post('/api/public/event-signups').send(b)
    const res = await request.post('/api/public/event-signups').send(b)
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already registered/)
  })
})

// ─────────────────────────────────────────────────────────
// PUBLIC SOCIETY APPLICATIONS
// ─────────────────────────────────────────────────────────
describe('Public society applications', () => {
  let societyId

  beforeAll(async () => {
    const soc = await seedSociety()
    societyId = soc._id.toString()
  })

  const body = () => ({
    societyId,
    name: 'Applicant One',
    regNo: `APP-${Date.now()}`,
    department: 'English',
    programme: 'BS',
    semester: 2,
    email: 'app1@pu.edu.pk',
    phone: '03009876543',
    applyingAs: 'General member',
  })

  test('application succeeds and returns 201', async () => {
    const b = body()
    const res = await request.post('/api/public/society-applications').send(b)
    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)
  })

  test('duplicate regNo + society returns 409', async () => {
    const b = body()
    await request.post('/api/public/society-applications').send(b)
    const res = await request.post('/api/public/society-applications').send(b)
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already applied/)
  })
})

// ─────────────────────────────────────────────────────────
// COMPLAINTS
// ─────────────────────────────────────────────────────────
describe('Complaints', () => {
  const regNo1 = `CMP-REG-${Date.now()}`
  const regNo2 = `CMP-REG-${Date.now() + 1}`
  let ref1, ref2

  const complaintBody = (regNo) => ({
    name: 'Complainant One',
    regNo,
    department: 'Chemistry',
    programme: 'BS',
    semester: 4,
    email: 'cmp@pu.edu.pk',
    phone: '03111111111',
    category: 'Other',
    subject: 'Test complaint subject for testing',
    details: 'This is a detailed description of the problem that is long enough to pass the minimum length validation requirement of twenty characters.',
  })

  test('creates with correct CMP-YYYY-NNNN format', async () => {
    const res = await request.post('/api/public/complaints').send(complaintBody(regNo1))
    expect(res.status).toBe(201)
    expect(res.body.ref).toMatch(/^CMP-\d{4}-\d{4}$/)
    ref1 = res.body.ref
  })

  test('two complaints get different refs', async () => {
    const res = await request.post('/api/public/complaints').send(complaintBody(regNo2))
    expect(res.status).toBe(201)
    ref2 = res.body.ref
    expect(ref2).not.toBe(ref1)
  })

  test('tracking with wrong regNo returns 404', async () => {
    const res = await request.post('/api/public/complaints/track').send({ ref: ref1, regNo: 'WRONG-999' })
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/No complaint matches/)
  })

  test('tracking returns only safe fields — never phone, email, details, history', async () => {
    const res = await request.post('/api/public/complaints/track').send({ ref: ref1, regNo: regNo1 })
    expect(res.status).toBe(200)
    expect(res.body.complaint.ref).toBe(ref1)
    expect(res.body.complaint.status).toBe('New')
    expect(res.body.complaint.phone).toBeUndefined()
    expect(res.body.complaint.email).toBeUndefined()
    expect(res.body.complaint.details).toBeUndefined()
    expect(res.body.complaint.history).toBeUndefined()
  })

  test('admin response auto-promotes New → In review; student sees it via tracking', async () => {
    const { cookie } = await createAdmin()
    const complaint = await Complaint.findOne({ ref: ref1 })
    expect(complaint).not.toBeNull()

    const patchRes = await request
      .patch(`/api/admin/complaints/${complaint._id}`)
      .set('Cookie', cookie)
      .send({ response: 'We are looking into this matter carefully.' })

    expect(patchRes.status).toBe(200)
    expect(patchRes.body.complaint.status).toBe('In review')
    expect(patchRes.body.complaint.respondedBy).toBe('Test Admin')

    const trackRes = await request.post('/api/public/complaints/track').send({ ref: ref1, regNo: regNo1 })
    expect(trackRes.body.complaint.response).toBe('We are looking into this matter carefully.')
    expect(trackRes.body.complaint.status).toBe('In review')
  })
})

// ─────────────────────────────────────────────────────────
// APPROVE SIGNUP → creates Student + Registration (idempotent)
// ─────────────────────────────────────────────────────────
describe('Approve signup', () => {
  let signupId, eventId
  const regNo = `APR-${Date.now()}`

  beforeAll(async () => {
    const ev = await seedEvent(`Approve-Test-${Date.now()}`)
    eventId = ev._id.toString()
    const signup = await EventSignup.create({
      event: ev._id,
      eventName: ev.name,
      name: 'Approve Student',
      regNo,
      department: 'Physics',
      programme: 'BS',
      semester: 2,
      email: 'apr@pu.edu.pk',
      phone: '03222222222',
      role: 'Participant',
    })
    signupId = signup._id.toString()
  })

  test('approve creates student and registration', async () => {
    const { cookie } = await createAdmin()
    const res = await request.post(`/api/admin/event-signups/${signupId}/approve`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const student = await Student.findOne({ regNo })
    expect(student).not.toBeNull()

    const reg = await Registration.findOne({ event: eventId, student: student._id })
    expect(reg).not.toBeNull()
  })

  test('approving twice does not create duplicate student or registration', async () => {
    const { cookie } = await createAdmin()
    await request.post(`/api/admin/event-signups/${signupId}/approve`).set('Cookie', cookie)

    const students = await Student.find({ regNo })
    expect(students).toHaveLength(1)

    const student = students[0]
    const regs = await Registration.find({ event: eventId, student: student._id })
    expect(regs).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────
// NoSQL INJECTION
// ─────────────────────────────────────────────────────────
describe('NoSQL injection is blocked', () => {
  test('operator injection in regNo is rejected or neutralised', async () => {
    const res = await request
      .post('/api/public/complaints/track')
      .send({ ref: 'CMP-2026-0001', regNo: { $ne: '' } })
    // Either 400 (schema validation) or 404 (sanitised to string and not found)
    expect([400, 404]).toContain(res.status)
    expect(res.body.complaint).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────
// CASCADE DELETES
// ─────────────────────────────────────────────────────────
describe('Cascade deletes', () => {
  test('deleting an event also deletes its registrations', async () => {
    const { cookie } = await createAdmin()
    const ev = await seedEvent(`CascadeEvent-${Date.now()}`)
    const stu = await Student.create({ name: 'Cascade S', regNo: `CSC-${Date.now()}`, department: 'D', programme: 'BS', semester: 1 })
    await Registration.create({ event: ev._id, student: stu._id, role: 'Participant' })

    const delRes = await request.delete(`/api/admin/events/${ev._id}`).set('Cookie', cookie)
    expect(delRes.status).toBe(200)

    const regs = await Registration.find({ event: ev._id })
    expect(regs).toHaveLength(0)
  })

  test('deleting a student also deletes their registrations', async () => {
    const { cookie } = await createAdmin()
    const ev = await seedEvent(`CascadeStudentEvent-${Date.now()}`)
    const stu = await Student.create({ name: 'Cascade S2', regNo: `CS2-${Date.now()}`, department: 'D', programme: 'BS', semester: 1 })
    await Registration.create({ event: ev._id, student: stu._id, role: 'Participant' })

    const delRes = await request.delete(`/api/admin/students/${stu._id}`).set('Cookie', cookie)
    expect(delRes.status).toBe(200)

    const regs = await Registration.find({ student: stu._id })
    expect(regs).toHaveLength(0)
  })
})
