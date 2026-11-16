import { badRequest } from '../utils/apiError.js'

/**
 * Validate request body/query/params with a Zod schema.
 * Usage: validate(schema, 'body' | 'query' | 'params')
 */
export const validate = (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }))
      throw badRequest('Validation failed.', details)
    }
    req[source] = result.data
    next()
  }

/**
 * Validate that :id is a valid MongoDB ObjectId.
 */
export const validateObjectId = (paramName = 'id') =>
  (req, res, next) => {
    const val = req.params[paramName]
    if (!val || !/^[a-f\d]{24}$/i.test(val)) {
      throw badRequest(`Invalid ID: ${paramName}.`)
    }
    next()
  }
