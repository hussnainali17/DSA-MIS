/**
 * Seed script — idempotent: safe to run many times.
 * Creates: superadmin, 11 societies, sample events, optional demo students.
 *
 * Usage:
 *   npm run seed            # core data only
 *   npm run seed -- --demo  # + 2 synthetic students
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '../config/db.js'
import env from '../config/env.js'

import AdminUser from '../models/AdminUser.js'
import Society from '../models/Society.js'
import Event from '../models/Event.js'
import Student from '../models/Student.js'
import Registration from '../models/Registration.js'
import EventSignup from '../models/EventSignup.js'
import SocietyApplication from '../models/SocietyApplication.js'
import Complaint from '../models/Complaint.js'
import Counter from '../models/Counter.js'
import AuditLog from '../models/AuditLog.js'

const DEMO = process.argv.includes('--demo')

// ── Societies ──
const SOCIETIES = [
  { slug: 'media', name: 'Pioneers Media Society (PMS)', about: 'Photography, film, design and campus media coverage. Runs yearly inductions with portfolio submissions and interviews.' },
  { slug: 'debating', name: 'Pioneers Debating Society', about: 'Represents the university in inter-university and national debating competitions.' },
  { slug: 'declamation', name: 'Pioneers Declamation Society', about: 'Trains speakers for trilingual and national declamation championships.' },
  { slug: 'literary', name: 'Pioneers Literary Society', about: 'Writing, poetry and literary gatherings across the campus.' },
  { slug: 'dramatic', name: 'Pioneers Dramatic Society', about: 'Stage plays, skits and theatre festivals.' },
  { slug: 'quiz', name: 'Pioneers Quiz Society', about: 'Quiz teams for university and inter-university contests.' },
  { slug: 'naat', name: 'Pioneers Naat Society', about: 'Naat recitation at university programmes and competitions.' },
  { slug: 'qiraat', name: 'Pioneers Qiraat Society', about: 'Quran recitation at university programmes and competitions.' },
  { slug: 'art', name: 'Pioneers Art Society', about: 'Exhibitions, live painting and visual art competitions.' },
  { slug: 'singing', name: 'Pioneers Singing Society', about: 'Vocal performance at festivals and university events.' },
  { slug: 'instrumental', name: 'Instrumental Music', about: 'Instrumental and music-related activity. The official society name is still to be confirmed with DSA.' },
]

// ── Events ──
const EVENTS = [
  {
    name: 'PUCAD Grand Art Exhibition 2026',
    society: 'Pioneers Art Society',
    level: 'University',
    start: new Date('2026-08-14'),
    end: new Date('2026-09-03'),
    venue: 'PUCAD, University of the Punjab',
    note: 'Art Society and PUCAD',
    published: true,
  },
  {
    name: 'DSA Co-curricular Admissions Trials 2026',
    society: 'DSA',
    level: 'University',
    start: new Date('2026-08-18'),
    end: new Date('2026-08-20'),
    venue: 'University of the Punjab',
    note: 'Trials across competition categories',
    published: true,
  },
  {
    name: 'Zero Week Orientation 2026',
    society: 'DSA',
    level: 'University',
    start: new Date('2026-09-07'),
    end: new Date('2026-09-11'),
    venue: 'University of the Punjab',
    note: 'Orientations and registrations for new students',
    published: true,
  },
  {
    name: 'All Pakistan PU Media Fest 2026',
    society: 'Pioneers Media Society (PMS)',
    level: 'National',
    dateLabel: '2026',
    venue: 'University of the Punjab',
    note: '13 modules, 400+ participants, 60+ institutions',
    published: true,
  },
  {
    name: 'Interfaith Photowalk 2026',
    society: 'Pioneers Media Society (PMS)',
    level: 'University',
    dateLabel: '2026',
    venue: 'Lahore',
    note: 'Student photography walk',
    published: true,
  },
  {
    name: 'National Minorities Day Debates Competition',
    society: 'Pioneers Debating Society',
    level: 'National',
    dateLabel: 'Annual',
    venue: 'University of the Punjab',
    note: 'Debating Society',
    published: true,
  },
]

// ── Demo students (synthetic, never real data) ──
const DEMO_STUDENTS = [
  { name: 'Sample Student One', regNo: 'SYN-0001', department: 'Mass Communication', programme: 'BS', semester: 3 },
  { name: 'Sample Student Two', regNo: 'SYN-0002', department: 'English', programme: 'BS', semester: 5 },
]

async function seed() {
  console.log('[seed] Starting...')

  // Validate seed admin password
  if (!env.SEED_ADMIN_PASSWORD || env.SEED_ADMIN_PASSWORD.length < 10) {
    console.error('[seed] SEED_ADMIN_PASSWORD must be set in .env and be at least 10 characters.')
    process.exit(1)
  }

  await connectDB()

  // 1. Superadmin
  const existing = await AdminUser.findOne({ username: env.SEED_ADMIN_USERNAME })
  if (existing) {
    console.log(`[seed] Admin "${env.SEED_ADMIN_USERNAME}" already exists — skipping.`)
  } else {
    const hash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12)
    await AdminUser.create({
      username: env.SEED_ADMIN_USERNAME,
      name: env.SEED_ADMIN_NAME,
      passwordHash: hash,
      role: 'superadmin',
    })
    console.log(`[seed] Created superadmin "${env.SEED_ADMIN_USERNAME}".`)
  }

  // 2. Societies (upsert by slug)
  for (const s of SOCIETIES) {
    await Society.updateOne({ slug: s.slug }, { $set: s }, { upsert: true })
  }
  console.log(`[seed] ${SOCIETIES.length} societies upserted.`)

  // 3. Events (upsert by name)
  for (const e of EVENTS) {
    await Event.updateOne({ name: e.name }, { $set: e }, { upsert: true })
  }
  console.log(`[seed] ${EVENTS.length} events upserted.`)

  // 4. Demo students
  if (DEMO) {
    for (const s of DEMO_STUDENTS) {
      await Student.updateOne({ regNo: s.regNo }, { $set: s }, { upsert: true })
    }
    console.log(`[seed] ${DEMO_STUDENTS.length} demo students upserted.`)
  }

  // 5. Sync indexes
  const models = [AdminUser, Society, Event, Student, Registration, EventSignup, SocietyApplication, Complaint, Counter, AuditLog]
  for (const M of models) {
    await M.syncIndexes()
  }
  console.log('[seed] Indexes synced.')

  console.log('[seed] Done.')
  await mongoose.connection.close()
}

seed().catch((err) => {
  console.error('[seed] Error:', err.message)
  process.exit(1)
})
