/**
 * Custom API error with HTTP status code.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = []) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

export const badRequest = (msg, details) => new ApiError(400, msg, details)
export const unauthorized = (msg = 'Authentication required.') => new ApiError(401, msg)
export const forbidden = (msg = 'You do not have permission to do this.') => new ApiError(403, msg)
export const notFound = (msg = 'Not found.') => new ApiError(404, msg)
export const conflict = (msg) => new ApiError(409, msg)
export const serverError = (msg = 'An unexpected error occurred.') => new ApiError(500, msg)
