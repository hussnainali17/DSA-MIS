import { z } from 'zod'
import { normalisePhone, collapseSpaces } from '../utils/pick.js'

// Reusable student sub-schema (used across event signups, society applications, complaints)
const phone = z
  .string()
  .trim()
  .transform(normalisePhone)
  .refine((v) => /^03\d{9}$/.test(v), { message: 'Phone must be a valid Pakistani mobile number (e.g. 03001234567)' })

export const studentFields = z.object({
  name: z.string().trim().min(1).max(200).transform(collapseSpaces),
  regNo: z.string().trim().min(1).max(40).transform((v) => v.trim().toUpperCase()),
  department: z.string().trim().min(1).max(200).transform(collapseSpaces),
  programme: z.enum(['BS', 'MA / MSc', 'MPhil', 'PhD']),
  semester: z.coerce.number().int().min(1).max(12),
  email: z.string().trim().email().toLowerCase().max(200),
  phone,
})

export const eventSignupSchema = studentFields
  .extend({
    eventId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid event ID'),
    role: z.enum(['Participant', 'Team member', 'Volunteer']),
    category: z.string().trim().max(200).optional().default(''),
    website: z.string().optional().default(''), // honeypot
  })
  .strict()

export const societyApplicationSchema = studentFields
  .extend({
    societyId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid society ID').optional(),
    societySlug: z.string().trim().max(80).optional(),
    applyingAs: z.enum(['General member', 'Cabinet position']),
    position: z.string().trim().max(200).optional().default(''),
    experience: z.string().trim().max(2000).optional().default(''),
    website: z.string().optional().default(''), // honeypot
  })
  .strict()
  .refine((d) => d.societyId || d.societySlug, {
    message: 'Either societyId or societySlug is required',
    path: ['societyId'],
  })

export const complaintSchema = studentFields
  .extend({
    category: z.enum([
      'Society or cabinet matter',
      'Event or competition',
      'Attendance or sessional recommendation',
      'Conduct of a student or staff member',
      'Harassment or misconduct',
      'Facilities, transport or logistics',
      'Other',
    ]),
    incidentDate: z.string().optional().nullable(),
    against: z.string().trim().max(300).optional().default(''),
    subject: z.string().trim().min(1).max(120).transform(collapseSpaces),
    details: z.string().trim().min(20).max(5000),
    website: z.string().optional().default(''), // honeypot
  })
  .strict()

export const trackComplaintSchema = z
  .object({
    ref: z.string().trim().min(1).max(30).transform((v) => v.trim().toUpperCase()),
    regNo: z.string().trim().min(1).max(40).transform((v) => v.trim().toUpperCase()),
  })
  .strict()

export const loginSchema = z
  .object({
    username: z.string().trim().min(1).max(40).toLowerCase(),
    password: z.string().min(1).max(200),
  })
  .strict()

export const createUserSchema = z
  .object({
    username: z.string().trim().min(3).max(40).toLowerCase(),
    name: z.string().trim().min(1).max(120),
    password: z.string().min(10).max(200),
    role: z.enum(['admin', 'superadmin']).optional().default('admin'),
  })
  .strict()

export const patchUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    active: z.boolean().optional(),
    password: z.string().min(10).max(200).optional(),
    role: z.enum(['admin', 'superadmin']).optional(),
  })
  .strict()

export const eventSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    society: z.string().trim().max(200).optional().default('DSA'),
    level: z.enum(['University', 'Inter-university', 'National']).optional().default('University'),
    start: z.string().optional().nullable(),
    end: z.string().optional().nullable(),
    dateLabel: z.string().trim().max(100).optional().default(''),
    venue: z.string().trim().max(300).optional().default(''),
    note: z.string().trim().max(1000).optional().default(''),
    published: z.boolean().optional().default(true),
  })

export const patchEventSchema = eventSchema.partial()

export const studentAdminSchema = z.object({
  name: z.string().trim().min(1).max(200),
  regNo: z.string().trim().min(1).max(40).transform((v) => v.trim().toUpperCase()),
  department: z.string().trim().min(1).max(200),
  programme: z.enum(['BS', 'MA / MSc', 'MPhil', 'PhD']),
  semester: z.coerce.number().int().min(1).max(12),
  email: z.string().trim().email().toLowerCase().max(200).optional().default(''),
  phone: z.string().trim().max(20).optional().default(''),
})

export const patchStudentSchema = studentAdminSchema.partial()

export const registrationSchema = z.object({
  eventId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid event ID'),
  studentId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid student ID'),
  role: z.enum(['Participant', 'Team member', 'Team lead', 'Volunteer']),
  category: z.string().trim().max(200).optional().default(''),
})

export const signupStatusSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Declined']),
})

export const complaintAdminPatchSchema = z.object({
  status: z.enum(['New', 'In review', 'Resolved', 'Closed']).optional(),
  response: z.string().trim().max(5000).optional(),
})
