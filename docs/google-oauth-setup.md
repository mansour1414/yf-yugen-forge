# Google Sign-In — Google Cloud Console Setup

This project uses **Google Identity Services (GIS)**, ID-token flow (not the redirect-based
OAuth code flow). That means you only need to configure **Authorized JavaScript origins** —
no redirect URI is required for this implementation.

## 1. Create/select a Google Cloud project
1. Go to https://console.cloud.google.com/
2. Create a new project (or select an existing one) for YF-YUGEN FORGE.

## 2. Configure the OAuth consent screen (Google Auth Platform)
1. In the left sidebar: **APIs & Services → OAuth consent screen** (sometimes shown as
   "Google Auth Platform" in newer Cloud Console UI).
2. User type: **External** (unless you specifically use a Google Workspace org and want
   **Internal**).
3. Fill in the app name (e.g. "YF Digital Studio"), support email, and developer contact
   email.
4. Add the scopes: the default `openid`, `email`, and `profile` scopes are sufficient —
   this implementation only reads the verified email, name, and picture from the ID token.
5. Add test users if the app is still in "Testing" publishing status (any Google account
   you want to sign in with during development must be added here until you publish the
   consent screen).

## 3. Create a Web Application OAuth Client
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Name it something like "YF-YUGEN FORGE Web".
4. **Authorized JavaScript origins** — add every origin the site is actually served from:
   - Local development: `http://localhost:5173` (matches this project's `CLIENT_URL` in
     `.env.example`)
   - Production: `https://yf-yugen-forge.vercel.app` (the domain currently configured as
     `CLIENT_URL` in this project's `.env`) — **if you later attach a custom domain in
     Vercel, add that origin here too and keep both until the switch is confirmed.**
   - Add any Vercel preview domain pattern you rely on, if you test Google Sign-In on
     preview deployments (each preview URL is a distinct origin and must be added
     individually, or you can skip Google testing on previews).
5. **Authorized redirect URIs** — leave this empty. It isn't used by this flow.
6. Save. Copy the generated **Client ID** (looks like
   `1234567890-abc...xyz.apps.googleusercontent.com`).

## 4. Configure environment variables
Set the **same** Client ID in both places (see `.env.example`):

```
# Frontend (Vite) — exposed to the browser, this is expected/safe for a Client ID
VITE_GOOGLE_CLIENT_ID=1234567890-abc...xyz.apps.googleusercontent.com

# Backend — used to verify the ID token's audience
GOOGLE_CLIENT_ID=1234567890-abc...xyz.apps.googleusercontent.com
```

There is no Client Secret involved — this flow never needs one, and none should ever be
added to frontend code.

## 5. Restart both the frontend dev server and the backend
Environment variables are only read at startup.

## Notes on how sign-in works here
- The "Continue with Google" button only **links to or signs into an existing local
  account** matched by verified email. It never creates a brand-new account — see the
  implementation report for why, and what a Google user sees if no matching account exists.
- Google users never get to pick their own role, and existing Admin accounts are never
  affected unless the linked email exactly matches an existing Admin's account.
