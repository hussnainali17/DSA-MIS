import env from './config/env.js'
import { connectDB } from './config/db.js'
import app from './app.js'

const start = async () => {
  await connectDB()
  app.listen(env.PORT, () => {
    console.log(`[server] Running on port ${env.PORT} (${env.NODE_ENV})`)
  })
}

start()
