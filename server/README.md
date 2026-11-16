# DSA Server — REST API Backend

Backend for the Directorate of Students Affairs (DSA) website, University of the Punjab.

## Quick start

```bash
cd server
npm install
cp .env.example .env
# Edit .env: paste your MONGODB_URI, set JWT_SECRET (≥ 32 chars), set SEED_ADMIN_PASSWORD (≥ 10 chars)
npm run seed
npm run dev
```

The API runs on `http://localhost:5000`. The frontend (Vite) proxies `/api` requests here.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Session signing key (≥ 32 characters) |
| `PORT` | | Server port (default 5000) |
| `NODE_ENV` | | `development` / `production` / `test` |
| `JWT_EXPIRES_IN` | | Token lifetime (default `8h`) |
| `CLIENT_ORIGIN` | | Allowed CORS origin (default `http://localhost:5173`) |
| `COOKIE_SECURE` | | `true` in production (HTTPS), `false` in dev |
| `SEED_ADMIN_USERNAME` | | Initial admin username (default `admin`) |
| `SEED_ADMIN_PASSWORD` | ✅ for seed | Admin password (≥ 10 characters) |
| `SEED_ADMIN_NAME` | | Admin display name |

## API endpoints

### Public (no authentication)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/public/events` | Published events |
| GET | `/api/public/societies` | All 11 societies |
| POST | `/api/public/event-signups` | Student registers for an event |
| POST | `/api/public/society-applications` | Student applies to a society |
| POST | `/api/public/complaints` | Submit a complaint |
| POST | `/api/public/complaints/track` | Track complaint by ref + regNo |

### Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/auth/login` | Login (sets httpOnly cookie) |
| POST | `/api/admin/auth/logout` | Logout (clears cookie) |
| GET | `/api/admin/auth/me` | Current user info |

### Admin (requires cookie)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard counts |
| GET | `/api/admin/events` | List events |
| POST | `/api/admin/events` | Create event |
| PATCH | `/api/admin/events/:id` | Update event |
| DELETE | `/api/admin/events/:id` | Delete event + registrations |
| GET | `/api/admin/students` | List/search students |
| POST | `/api/admin/students` | Create student |
| PATCH | `/api/admin/students/:id` | Update student |
| DELETE | `/api/admin/students/:id` | Delete student + registrations |
| GET | `/api/admin/registrations` | List registrations |
| POST | `/api/admin/registrations` | Register student for event |
| DELETE | `/api/admin/registrations/:id` | Remove registration |
| GET | `/api/admin/event-signups` | List public event signups |
| PATCH | `/api/admin/event-signups/:id/status` | Update signup status |
| POST | `/api/admin/event-signups/:id/approve` | Approve signup → creates Student + Registration |
| DELETE | `/api/admin/event-signups/:id` | Delete signup |
| GET | `/api/admin/society-applications` | List society applications |
| PATCH | `/api/admin/society-applications/:id/status` | Update application status |
| DELETE | `/api/admin/society-applications/:id` | Delete application |
| GET | `/api/admin/complaints` | List complaints |
| GET | `/api/admin/complaints/:id` | Complaint detail + history |
| PATCH | `/api/admin/complaints/:id` | Respond to complaint |
| DELETE | `/api/admin/complaints/:id` | Delete (superadmin only) |
| GET | `/api/admin/users` | List admin users (superadmin) |
| POST | `/api/admin/users` | Create admin user (superadmin) |
| PATCH | `/api/admin/users/:id` | Update admin user (superadmin) |
| DELETE | `/api/admin/users/:id` | Delete admin user (superadmin) |

## Running tests

```bash
npm test
```

Tests use `mongodb-memory-server` (downloads MongoDB binary on first run). No real database needed.

## Deploying

1. Set `NODE_ENV=production`
2. Set `COOKIE_SECURE=true` (requires HTTPS)
3. Use a long, random `JWT_SECRET` (≥ 32 characters)
4. Set `CLIENT_ORIGIN` to the real frontend URL
5. Run `npm run seed` once to create the admin user
6. Start with `npm start`

## Decisions

- **Complaint tracking**: returns only `ref`, `status`, `subject`, `createdAt`, `response`, `respondedAt` — never phone, email, details, or history.
- **Event signup approve flow**: idempotent — approving twice does not create duplicate students or registrations. Student records are upserted by `regNo`.
- **Phone normalisation**: accepts `03XXXXXXXXX` and `+92XXXXXXXXXX`, stores as `03XXXXXXXXX`.
- **Societies**: slug-based lookup for the public site, ObjectId-based for admin.
- **Event dates**: events may have `start`/`end` dates or just a `dateLabel` string (for undated events like "Annual").
