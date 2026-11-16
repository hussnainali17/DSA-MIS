// Jest global setup — runs before any test module is imported.
// Sets required environment variables for the test suite.
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-characters-long-!!'
process.env.JWT_EXPIRES_IN = '1h'
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.COOKIE_SECURE = 'false'
