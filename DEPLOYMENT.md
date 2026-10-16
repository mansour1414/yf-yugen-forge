# Deployment Guide — YF Yugen Forge (YF Digital Studio)

This guide covers complete production deployment instructions for YF Yugen Forge across Docker, VPS (PM2 + Nginx), and Kubernetes environments.

---

## 1. Environment Variables

Create a `.env` file in the project root with the following production values:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://yf_user:your_secure_password@localhost:5432/yf_yugen_forge?schema=public
JWT_SECRET=your_super_secure_jwt_secret_min_16_chars
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_min_16_chars
REFRESH_TOKEN_HASH_SECRET=your_super_secure_refresh_hash_secret_min_16_chars
CLIENT_URL=https://yf.studio
```

`JWT_SECRET`, `JWT_REFRESH_SECRET` and `REFRESH_TOKEN_HASH_SECRET` are all **required** (each at least 16
characters) — the server refuses to start if any of them is missing. Use three different values.

Optional variables (the matching feature is simply off when they are unset):

```env
# Absolute base URL used when building links to uploaded files (set this behind a proxy/CDN)
PUBLIC_URL=https://api.yf.studio

# Google Sign-In (same OAuth Web Client ID as VITE_GOOGLE_CLIENT_ID on the frontend)
GOOGLE_CLIENT_ID=

# Outbound email for the contact form and account invitations
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

SMTP note: port `587` uses STARTTLS and needs `SMTP_SECURE=false`; port `465` uses implicit TLS and needs
`SMTP_SECURE=true`. Some hosting providers block outbound SMTP ports entirely — if emails never arrive, check that
first.

The frontend build (e.g. on Vercel) additionally needs `VITE_API_URL` — the public base URL of this API, with no
trailing slash. A production build without it fails fast on load by design.

---

## 2. Docker Deployment (Recommended)

You can easily run the application and PostgreSQL using Docker Compose.

1. Build and start containers in detached mode:
   ```bash
   npm run docker:up
   ```
2. This will automatically:
   - Start PostgreSQL 16 with persistent volume storage (`postgres_data`).
   - Build the multi-stage Docker image for the Node.js/Express backend & React frontend.
   - Run database migrations (`npx prisma migrate deploy`).
   - Start the production server on port `5000`.

3. To stop containers:
   ```bash
   npm run docker:down
   ```

---

## 3. VPS Deployment (PM2 + Node.js + Nginx)

For standard Ubuntu/Debian VPS deployments:

1. **Install Node.js 20, PostgreSQL, and Nginx:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx postgresql postgresql-contrib
   sudo npm install -g pm2
   ```

2. **Clone & Install Dependencies:**
   ```bash
   git clone <repository-url> /app
   cd /app
   npm ci
   ```

3. **Configure Environment:**
   Create `.env` file as specified above.

4. **Run Database Migrations & Build:**
   ```bash
   npm run deploy
   ```

5. **Start with PM2 (Cluster Mode):**
   ```bash
   npm run start:pm2
   ```

---

## 4. Nginx Reverse Proxy Setup

`nginx.conf` in this repository is a **complete** Nginx main configuration (it contains `user`, `events` and
`http` blocks), so it replaces `/etc/nginx/nginx.conf` — it cannot be dropped into `sites-available/`, where
Nginx would reject the nested `http` block. It also expects the built frontend in `/app/dist`.

1. Install it and reload:
   ```bash
   sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
   sudo cp nginx.conf /etc/nginx/nginx.conf
   sudo nginx -t
   sudo systemctl restart nginx
   ```

2. **SSL Recommendation (Certbot / Let's Encrypt):**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yf.studio -d www.yf.studio
   ```

> Nginx is only relevant to the VPS/Docker paths above. With the split hosting setup (frontend on Vercel,
> API on Render) it is not used.

---

## 5. Prisma Migrations Policy

- **Never** use `prisma db push` in production.
- Always apply migrations via:
  ```bash
  npx prisma migrate deploy
  ```
- A database that was originally created with `db push` already contains the baseline schema. Mark the baseline
  migration as applied **once** before the first `migrate deploy`, otherwise Prisma refuses to run against a
  non-empty database (P3005):
  ```bash
  npx prisma migrate resolve --applied 20260825000000_baseline
  ```

---

## 6. Backup Recommendations

- **PostgreSQL Database Backups:**
  Schedule daily automated `pg_dump` backups via cron:
  ```bash
  0 2 * * * pg_dump -U yf_user yf_yugen_forge | gzip > /backups/yf_db_$(date +\%F).sql.gz
  ```
- **File Uploads Backup:**
  Ensure the `/app/uploads` directory is backed up alongside database dumps.

---

## 7. Render Deployment — Persistent Upload Storage

**This is an infrastructure setting, not something that can be fixed from code.** Render's default container filesystem is ephemeral — anything written to it (including uploaded files under `uploads/`) is lost on every redeploy or restart.

The application stores uploads at `process.cwd()/uploads`, which resolves to **`/app/uploads`** in the built Docker image (the `WORKDIR` in `Dockerfile` is `/app` in both build stages). This exact path is already used as the persistent volume mount point in `docker-compose.yml` for local/VPS Docker deployments.

**To make uploads survive Render redeploys, configure a Render Persistent Disk:**

1. In the Render dashboard, open the backend web service.
2. Go to **Disks** → **Add Disk**.
3. Set the **Mount Path** to exactly: `/app/uploads`
4. Choose a disk size appropriate for expected media volume (start small; it can be resized later).

The mount path must match `/app/uploads` exactly — the application resolves its upload directory from `process.cwd()` at runtime (see `src/server/utils/upload.ts`), and `WORKDIR /app` in `Dockerfile` means that always evaluates to `/app/uploads` inside the container. A different mount path would silently write files outside the persisted disk, and they would be lost on the next deploy.

No `render.yaml` exists in this repository, so this must currently be configured manually in the Render dashboard as described above. A `render.yaml` (Render "Blueprint") could codify this disk configuration, but was intentionally **not** added here — the disk size, plan tier, and service naming are deployment decisions that can't be safely inferred from the codebase alone, and inventing them risks locking in wrong assumptions. If you'd like, this can be added as a follow-up once those specifics are decided.

> Render Persistent Disks require a paid instance type (check your current plan). Without one, uploaded files disappear on every
> redeploy/restart while their database records remain (broken images in the media library). Either upgrade the
> plan or move uploads to external object storage (S3-compatible / Cloudinary / etc.).
