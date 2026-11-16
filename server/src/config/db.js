import mongoose from 'mongoose'

export async function connectDB(uri) {
  // Accept explicit URI (for tests) or fall from env
  const connectionString = uri || process.env.MONGODB_URI
  if (!connectionString) {
    console.error('[db] MONGODB_URI is not set.')
    process.exit(1)
  }
  try {
    await mongoose.connect(connectionString)
    if (process.env.NODE_ENV !== 'test') {
      console.log('[db] Connected to MongoDB')
    }
  } catch (err) {
    console.error('[db] Connection failed:', err.message)
    process.exit(1)
  }
}

mongoose.connection.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') console.error('[db] MongoDB error:', err.message)
})

mongoose.connection.on('disconnected', () => {
  if (process.env.NODE_ENV !== 'test') console.warn('[db] MongoDB disconnected')
})
