This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string (Azure PostgreSQL in production).
- `AUTH_SECRET`: secret used for signing session cookies.
- `STORAGE_BACKEND`: `local` or `azure`. (Defaults to local)
- `UPLOAD_DIR`: local filesystem upload path (used only when `STORAGE_BACKEND=local`).
- `AZURE_STORAGE_CONNECTION_STRING`: required when `STORAGE_BACKEND=azure`.
- `AZURE_STORAGE_CONTAINER`: required when `STORAGE_BACKEND=azure`.

## Storage backend

The app uses a storage abstraction in `src/server/storage`:

- `LocalFsStorage`: stores files on local disk.
- `AzureBlobStorage`: stores files in Azure Blob Storage.

Backend selection is automatic via `STORAGE_BACKEND`.

## Azure deployment notes

- Set `DATABASE_URL` to your Azure PostgreSQL connection string.
- Set `STORAGE_BACKEND=azure` and provide Azure Blob variables.
- Run migrations during deploy: `npx prisma migrate deploy`.

Check out [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
