/**
 * Pick only specified keys from an object (safe field selection).
 */
export const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k]
    return acc
  }, {})

/**
 * Normalise a Pakistani mobile number to 03XXXXXXXXX format.
 * Accepts: 03001234567, +923001234567, 923001234567
 */
export function normalisePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.startsWith('0092') && digits.length === 14) return '0' + digits.slice(4)
  if (digits.startsWith('92') && digits.length === 12) return '0' + digits.slice(2)
  if (digits.startsWith('03') && digits.length === 11) return digits
  return raw // return as-is if unrecognised — validation catches it
}

/**
 * Collapse multiple spaces in a string to one and trim.
 */
export const collapseSpaces = (s) => String(s || '').trim().replace(/\s+/g, ' ')
