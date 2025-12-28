SaaS Backend (Multi-Tenant, RBAC)

This project is a backend-focused SaaS system built to understand how real production backends handle authentication, authorization, and multi-tenancy.
The primary goal was backend architecture and security, not frontend design.
A minimal UI exists only to test API flows.



Key Features

JWT-based authentication
Role-Based Access Control (RBAC):ADMIN,MEMBER
Organization-level multi-tenancy
Secure project CRUD scoped to organization
Admin-only user invite API
Clean separation of:Controllers,Routes,Middleware



🛠 Tech Stack

Backend
Node.js
Express.js
PostgreSQL (Neon)
Prisma ORM
JWT
bcrypt
Deployment
Backend → Render
Database → Neon
Frontend (minimal testing UI) → GitHub Pages



Live Links -
Backend Api=https://saas-9s1s.onrender.com
Frontend (For testing only)=https://manak-sharma20.github.io/saas/login.html


🔐 Authentication Flow

1) User registers → organization created
2) First user becomes ADMIN
3) Login returns JWT
4) JWT is required in Authorization header:
5) Middleware verifies token & role



API Endpoints

Auth
POST /auth/register
POST /auth/login

Users
GET /users/me
POST /users/invite (ADMIN only)

Projects
GET /projects
POST /projects
DELETE /projects/:projectId


Authorization Rules
ADMIN	Create projects, invite users
MEMBER	View projects
Any user	Only access own organization data






 Notes

This project is intentionally backend-first
UI is minimal and not production-ready
Focus is on security, correctness, and architecture