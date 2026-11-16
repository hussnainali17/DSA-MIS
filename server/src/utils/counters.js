import Counter from '../models/Counter.js'

/**
 * Atomically generate the next complaint reference number for the given year.
 * Format: CMP-<year>-<seq padded to 4 digits>
 */
export async function nextComplaintRef(year = new Date().getFullYear()) {
  const key = `complaint-${year}`
  const doc = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  )
  return `CMP-${year}-${String(doc.seq).padStart(4, '0')}`
}
