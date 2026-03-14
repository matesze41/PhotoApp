# PhotoApp

A simple photo management web application built with Next.js (App Router), Prisma, and PostgreSQL.

## Chosen Architecture

The project follows a layered architecture:

1. **UI Layer**
- `src/components/PhotoAlbum.tsx` is the main client-side interface.
- It handles login/register, upload, listing, sorting, preview, and delete actions.

2. **API Layer**
- Route handlers are in `src/app/api/**/route.ts`.
- Endpoints expose REST-style operations for auth and photos:
  - `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`
  - `/api/photos`, `/api/photos/[id]`, `/api/photos/[id]/image`

3. **Service Layer**
- `src/server/services/photoService.ts` contains business logic:
  - input validation (photo name),
  - storage key generation,
  - orchestration between file storage and database operations.

4. **Repository/Data Layer**
- `src/server/repositories/photoRepository.ts` encapsulates Prisma database queries.
- `prisma/schema.prisma` defines `User` and `Photo` models and relevant indexes.

5. **Storage Abstraction**
- `src/server/storage/storage.ts` selects the storage backend by environment variable.
- Implementations:
  - local filesystem (`localFsStorage.ts`) for local/dev use,
  - Azure Blob Storage (`azureBlobStorage.ts`) for cloud use.

6. **Authentication**
- Cookie-based signed session token in `src/server/auth/session.ts`.
- `src/proxy.ts` injects authenticated user ID for photo API requests and blocks unauthorized write operations.

## Cloud Scalability

If deployed to a cloud provider, the architecture scales as follows:

1. **Horizontally Scalable App Tier**
- Application instances are mostly stateless (session is stored in signed cookie).
- Multiple app replicas can run behind a load balancer.

2. **Scalable Object Storage**
- Switching to `STORAGE_BACKEND=azure` moves image files to Azure Blob Storage.
- This avoids local disk dependency and supports multi-instance deployments.

3. **Scalable Database Tier**
- Metadata is stored in PostgreSQL and can be hosted on a managed service.
- Existing Prisma schema indexes support common sorting and filtering patterns.

4. **Production Deployment Pattern**
- Containerize app and run with orchestrator (e.g., AKS/Kubernetes, App Service, ECS).
- Use managed PostgreSQL + Blob Storage + shared `AUTH_SECRET`.
- Run Prisma migrations in CI/CD or as a one-off job.

## Notes for Better Scale

- Local filesystem backend (`STORAGE_BACKEND=local`) is not suitable for multi-replica production.
- Current API/image responses use `Cache-Control: no-store`; enabling CDN-friendly caching headers for image delivery would improve performance under higher traffic.
- Recommended additions for larger scale:
  - CDN in front of image content,
  - rate limiting on auth/upload endpoints,
  - centralized logging and monitoring.

## Migration Details
### Environment variables

- `DATABASE_URL`: PostgreSQL connection string (Azure PostgreSQL in production).
- `AUTH_SECRET`: secret used for signing session cookies.
- `STORAGE_BACKEND`: `local` or `azure`. (Defaults to local)
- `UPLOAD_DIR`: local filesystem upload path (used only when `STORAGE_BACKEND=local`).
- `AZURE_STORAGE_CONNECTION_STRING`: required when `STORAGE_BACKEND=azure`.
- `AZURE_STORAGE_CONTAINER`: required when `STORAGE_BACKEND=azure`.

### Storage backend

The app uses a storage abstraction in `src/server/storage`:

- `LocalFsStorage`: stores files on local disk.
- `AzureBlobStorage`: stores files in Azure Blob Storage.

Backend selection is automatic via `STORAGE_BACKEND`.

### Azure deployment notes

- Set `DATABASE_URL` to your Azure PostgreSQL connection string.
- Set `STORAGE_BACKEND=azure` and provide Azure Blob variables.
- Run migrations during deploy: `npx prisma migrate deploy`.