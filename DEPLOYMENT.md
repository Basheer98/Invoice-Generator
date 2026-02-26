# Deploying to Railway

## Database: SQLite → PostgreSQL

**Important:** Your app uses SQLite locally, but Railway’s filesystem is ephemeral. Data would be lost on redeploy. For production you need PostgreSQL.

### 1. Switch Prisma to PostgreSQL

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Add PostgreSQL on Railway

1. Create a new project on [Railway](https://railway.app)
2. Click **+ New** → **Database** → **PostgreSQL**
3. Railway creates a Postgres instance and sets `DATABASE_URL`
4. Add your app (Deploy from GitHub repo)
5. In your app service, ensure `DATABASE_URL` is available (Railway often links it automatically when both are in the same project)

### 3. Local development with PostgreSQL

Options:

- **Docker:** `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`
- **Neon/Supabase:** Free hosted Postgres, use the connection string in `.env`
- **Railway Postgres:** Create a dev database on Railway and use its URL locally

`.env` example:

```
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
```

### 4. Run migrations on deploy

Add a **build command** or **deploy script** in Railway:

```bash
npx prisma generate && npx prisma migrate deploy
```

Or in `package.json`:

```json
"scripts": {
  "build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

And add a **release command** in Railway (if supported) or a startup script:

```bash
npx prisma migrate deploy
```

### 5. Environment variables on Railway

- `DATABASE_URL` – from PostgreSQL service (auto-set when linked)
- `NEXTAUTH_URL` – your app URL, e.g. `https://your-app.up.railway.app`
- `NEXTAUTH_SECRET` – run `openssl rand -base64 32` and add the value

### 6. First deploy

After switching to PostgreSQL and creating migrations:

```bash
npx prisma migrate dev --name init_postgres
```

Commit the migration files, push to GitHub, and Railway will deploy.
