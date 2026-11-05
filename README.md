# Devora — Project Discovery & Planning Platform

Devora is a full-stack platform that helps developers discover software projects, receive personalized recommendations, and track their progress through structured roadmaps.

## Features

### Authentication & Security
- Email OTP signup and verification using Brevo.
- Argon2 password hashing.
- JWT access tokens and HTTP-only refresh cookies.
- Refresh token rotation and session revocation.
- Forgot password and password reset workflows.
- OTP expiry, attempt limits and resend cooldowns.
- Protected APIs and Zod request validation.

### Project Discovery & Planning
- 234 curated projects across multiple development fields.
- Personalized onboarding and recommendations.
- Project search, filtering and pagination.
- Project details and structured roadmaps.
- 1,161 roadmap milestones.
- Save, plan, start, complete and hide projects.
- Milestone progress tracking and dashboard statistics.


## Technology Stack

### Frontend
- React 18, Vite 6, JavaScript
- HTML5, CSS3 and Lucide React

### Backend
- Node.js, Express 5 and Prisma ORM 7
- PostgreSQL with Neon
- JWT, Argon2 and Zod
- Brevo email service

## Project Structure

- `backend/prisma/` — Database schema, migrations and project catalogue.
- `backend/src/config/` — Database configuration.
- `backend/src/controllers/` — API request controllers.
- `backend/src/middleware/` — Authentication and request middleware.
- `backend/src/routes/` — API route definitions.
- `backend/src/services/` — Business logic and integrations.
- `frontend/src/components/` — Reusable UI components.
- `frontend/src/context/` — Shared application state.
- `frontend/src/layouts/` — Application layouts.
- `frontend/src/pages/` — Application pages.
- `frontend/src/services/` — API and authentication services.
- `frontend/src/styles/` — Global styles.
## Prerequisites

- Node.js 20.19+, 22.12+ or 24.0+
- pnpm
- PostgreSQL / Neon database
- Brevo API credentials for email delivery

## Environment Configuration

Copy backend/.env.example to backend/.env and configure DATABASE_URL, DIRECT_URL, PORT, NODE_ENV, JWT_ACCESS_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, FRONTEND_URL, OTP_HASH_SECRET, OTP_TTL_MINUTES, OTP_MAX_ATTEMPTS and OTP_RESEND_COOLDOWN_SECONDS.

Copy frontend/.env.example to frontend/.env and configure:

VITE_API_BASE_URL=http://localhost:5000/api

Never commit environment files or expose secret values.

## Installation

Install dependencies using `pnpm install` separately inside `backend/` and `frontend/`.

## Run Locally

Start the backend using `pnpm dev` inside `backend/`.

Start the frontend using `pnpm dev` inside `frontend/`.

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health
## API Overview

### Authentication — /api/auth
- POST /signup — Register account
- POST /signup/verify-otp — Verify signup OTP
- POST /signup/resend-otp — Resend OTP
- POST /login — User login
- POST /forgot-password — Request password reset
- POST /reset-password — Reset password
- GET /me — Current authenticated user
- POST /refresh — Refresh access token
- POST /logout — Revoke session

### Platform — /api
All platform endpoints require authentication.
- GET/PATCH /users/profile — Read or update profile
- GET/PUT /users/preferences — Read or update preferences
- GET /users/dashboard — Dashboard data
- GET /users/projects — User project tracking
- GET /projects — Project catalogue
- GET /projects/recommendations — Personalized recommendations
- GET /projects/:id — Project details and roadmap
- PUT /users/projects/:projectId/status — Update project status
- PUT /users/projects/:projectId/milestones/:milestoneId — Update milestone progress
## Database

Devora uses PostgreSQL with Prisma ORM. The database schema is maintained in backend/prisma/schema.prisma.

Core models include User, UserPreference, Project, ProjectRoadmap, UserProjectState, ProjectMilestoneProgress, UserSession and OtpVerification.

The project catalogue is maintained in backend/prisma/data/projects.json. Review migrations and seed operations carefully before running them against an existing database. Never run destructive database operations without a verified backup.

## Testing

Run the validation commands:

```bash
cd backend
pnpm test
pnpm test:api

cd ../frontend
pnpm build
```

## Security Notes

- Keep database credentials and authentication secrets private.
- Use HTTPS and production environment variables when deploying.
- Refresh tokens are stored in HTTP-only cookies.
- Email OTP delivery requires valid Brevo configuration.
- No external AI API integration is currently configured.
