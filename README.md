# Catat

A personal notetaking app: rich-text notes (bold/italic/underline, ordered and
unordered lists, a title, and H1–H6 headings) organized into notebooks, with
image/file attachments, running on Next.js + SQLite + MinIO, behind Caddy for
HTTPS, all via Docker Compose.

## Running it

1. Copy the environment template and fill in real values:

   ```bash
   cp .env.example .env
   ```

   - `BETTER_AUTH_SECRET`: generate with `openssl rand -base64 32`
   - `MINIO_ROOT_PASSWORD`: pick a long random password
   - `RESEND_API_KEY` / `EMAIL_FROM`: needed for sign-up email verification —
     see [Email verification](#email-verification) below
   - Leave `BETTER_AUTH_URL` and `SITE_ADDRESS` as `localhost` for local use

2. Start the stack:

   ```bash
   docker compose up --build
   ```

3. Open <https://localhost>. Caddy serves a locally-trusted HTTPS certificate
   for `localhost`; your browser may still show a warning the first time
   unless you [trust Caddy's local CA](https://caddyserver.com/docs/automatic-https#local-https)
   (`docker compose exec caddy caddy trust`, then follow the printed
   instructions for your OS).

4. Sign up for the one account you'll use, create a notebook, and start
   writing.

Data persists in named Docker volumes (`sqlite-data`, `minio-data`,
`caddy-data`/`caddy-config`) across `docker compose down` / `up`. Use
`docker compose down -v` to wipe everything.

## Deploying to a real domain

Set `SITE_ADDRESS` in `.env` to your domain (e.g. `notes.example.com`) and
`BETTER_AUTH_URL` to `https://notes.example.com`, point DNS at the host, and
make sure ports 80/443 are reachable — Caddy will automatically obtain a real
Let's Encrypt certificate instead of the local one.

## Email verification

New sign-ups must click a verification link before they can sign in;
Catat sends that email via [Resend](https://resend.com).

1. Create a Resend account and API key at
   [resend.com/api-keys](https://resend.com/api-keys), set it as
   `RESEND_API_KEY`.
2. Verify a sending domain at
   [resend.com/domains](https://resend.com/domains). A subdomain (e.g.
   `catat.example.com`) works fine here and is actually preferred — it
   isolates this app's sending reputation from your main domain's email,
   and doesn't touch any existing SPF/DKIM/MX records on the root domain.
   Add the TXT/CNAME records Resend gives you at your DNS provider for
   that subdomain.
3. Set `EMAIL_FROM` to an address on the verified (sub)domain, e.g.
   `Catat <noreply@catat.example.com>`.

If someone signs up but doesn't see the email, the sign-in page shows a
"Resend verification email" link once they try to sign in unverified.

## Adding OAuth sign-in later

Email/password sign-in is enabled by default. To add an OAuth provider (e.g.
Google), add its client id/secret to `.env`, then populate the
`socialProviders` option in `lib/auth.ts` — no schema changes needed.

## Local development (without Docker)

```bash
npm install
cp .env.example .env   # then edit DATABASE_PATH to something like ./data/catat.db
npx drizzle-kit migrate
npm run dev
```

You'll also need a MinIO instance reachable at the `MINIO_*` env vars for
image/file uploads to work; everything else runs without it.
