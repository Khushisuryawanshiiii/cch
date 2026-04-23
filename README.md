# commercial control hub Fresh App

Fresh project scaffold for:

- Frontend: React (Vite) + Tailwind CSS + Shadcn UI
- Backend API: ASP.NET Core Web API (.NET 9)
- Database target: SQL Server (SSMS)

## Project Structure

- `frontend/` - React app and UI foundation
- `backend/` - .NET Web API service

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Run Backend

```powershell
cd backend
dotnet run
```

## Notes

- SQL Server connection is configured in backend app settings.
- Entity Framework Core setup is initialized with foundational RBAC entities:
  - `Users`, `Roles`, `Permissions`, `UserRoles`, `RolePermissions`
- API health endpoint added: `GET /health/db`
- JWT authentication and permission-based authorization scaffold are enabled.

## Initial API Endpoints

- `POST /api/users/bootstrap-admin` - one-time first user creation (works only when DB has zero users)
- `POST /api/auth/login` - returns JWT token, roles, and permissions
- `GET /api/auth/me` - returns authenticated profile from token claims
- `GET /api/users` - list users (authenticated)
- `POST /api/users` - create user (authenticated)
- `POST /api/users/{userId}/roles` - assign role to user (authenticated)
- `GET /api/roles` - list roles (authenticated)
- `GET /api/sales-process/ping` - sample protected sales-process endpoint
- `GET /api/order-governance/ping` - sample protected order-governance endpoint

## Seeded Users (Development)

The backend now auto-seeds initial users and role assignments on startup.

- `admin@commercialcontrolhub.local` / `Admin@123`
- `sales.manager@commercialcontrolhub.local` / `Sales@123`
- `regional.manager@commercialcontrolhub.local` / `Regional@123`
- `central.manager@commercialcontrolhub.local` / `Central@123`
- `og.sales@commercialcontrolhub.local` / `OgSales@123`
- `og.reviewer@commercialcontrolhub.local` / `OgReviewer@123`
- `og.approver@commercialcontrolhub.local` / `OgApprover@123`
- `og.ccmanager@commercialcontrolhub.local` / `OgCC@123`

## Landing App Setup

- Frontend landing app includes login + module cards and checks module access via JWT permissions.
- API base URL defaults to `http://localhost:5056`.
- Optional override: copy `frontend/.env.example` to `.env` and set `VITE_API_BASE_URL`.
