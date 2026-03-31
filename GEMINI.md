# Project Context: nis-db-gateway

## 🚀 Architecture & Tech Stack
- **Runtime**: [Bun](https://bun.sh) (v1.1+)
- **Framework**: [Hono](https://hono.dev)
- **Database**: MySQL/MariaDB (via Bun's native `SQL` client)
- **Authentication**:
  - **Admin Layer**: `bearerAuth` middleware using `ADMIN_TOKEN`.
  - **Data Layer**: `jwt` middleware using `JWT_SECRET` (HS256).

## 🛠 Project Standards
- **Formatting & Linting**: Managed by **Biome**.
  - Indent Style: `space` (2 spaces)
  - Quote Style: `single`
  - Semicolons: `asNeeded` (Minimal use)
- **Coding Style**:
  - Prefer explicit type definitions over `any` in TypeScript.
  - Use template literals over string concatenation.
  - Prefer `Number.isNaN()` over global `isNaN()`.

## 📡 API Endpoints & Logic
### 1. `POST /auth/token`
- **Auth**: Bearer (Admin)
- **Request Body (JSON)**:
  - `exp` (number): Optional expiration in seconds. Default is permanent (`never`).
  - `role` (string): Optional role. Default is `operator`.
  - `user` (string): Optional user identifier. Default is `nis`.
- **Logic**: Returns a signed JWT for data access.

### 2. `POST /bandwidth/search`
- **Auth**: JWT (Bearer)
- **Request**: JSON array of IP addresses (`ips`).
- **Logic**:
  - Transforms IPs to `/32` CIDR format.
  - Batches queries (max 500 IPs/batch) for performance.
  - Performs a complex JOIN across `CustomerServiceTechnical`, `CustomerServices`, and `ServiceShaping`.

## 📝 Commit Convention
Follows **Conventional Commits** (e.g., `feat:`, `fix:`, `chore:`, `docs:`, `style:`).

## 💡 Developer Notes
- Database configuration is automatically loaded from `.env` by Bun.
- Use `bunx biome check --write --unsafe .` for comprehensive formatting and linting fixes.
