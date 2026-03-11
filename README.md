# AI Interview Simulator (v0)

A minimal Next.js 14 App Router app with Tailwind CSS that mocks an AI-powered interview experience for fresh tech graduates.

## Features
- Stub authentication (email/password form) using client-side state only.
- Role & difficulty selection.
- Interview page with a placeholder AI question.
- Audio-only or Audio+Video recording using MediaRecorder.
- Start / Stop / Playback / Send (Send logs the Blob to the console).
- Simple routing: `/login` → `/select-role` → `/interview`.
- Route protection via client-side localStorage `loggedIn`.

## API (Stubbed)

All endpoints are same-origin Next.js App Router handlers under /api. Basic CORS headers are included and OPTIONS is supported for local testing.

- POST /api/login
  - Body: { "email": string, "password": string }
  - Validation: email required; password length >= 6
  - Response: { "token": "fake-token-123" }
  - Frontend: app/login/page.tsx calls this and stores token in localStorage

- GET /api/roles
  - Response: { "roles": string[] }
  - Frontend: components/role-select.tsx fetches with SWR; falls back to a local list on error

- POST /api/interview
  - FormData fields:
    - role: string
    - difficulty: string
    - media: Blob (audio/webm or video/webm). Fallback keys "audio" or "video" also accepted.
  - Response: { "success": true, "message": "Answer received." }
  - Frontend: components/recorder.tsx sends FormData with optional Authorization: Bearer <token>

### CURL examples

Login:
curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret1"}'

Roles:
curl -s http://localhost:3000/api/roles

Interview (audio example):
curl -s -X POST http://localhost:3000/api/interview \
  -H "Authorization: Bearer fake-token-123" \
  -F "role=Frontend Developer" \
  -F "difficulty=Medium" \
  -F "media=@answer-audio.webm;type=audio/webm"

## Notes
- This is a frontend-only scaffold. No real auth, AI, scoring, or PDFs are implemented yet.
- MediaRecorder requires user permission; ensure mic/camera permissions are granted in your browser.
- To “log out,” click the Log out button in the header on protected pages.

## Design Notes
- Color palette (max 5): neutrals (white/gray/black variants), primary (system primary), and emerald for success messages.
- Responsive with Tailwind utilities and shadcn/ui; headings use `text-balance`, adequate spacing, and accessible controls.

## Tech
- Next.js App Router
- Tailwind CSS (shadcn/ui components)
- TypeScript

## Getting Started (Local)
1. Download this project from v0 (three dots in the top-right → Download ZIP) or push to GitHub from v0 and clone it locally.
2. Install dependencies (npm, pnpm, or yarn).
3. Run the dev server:
   - `npm run dev` (or `pnpm dev`, `yarn dev`)
4. Open http://localhost:3000 — you’ll be redirected to `/login`.
5. Use any email/password to sign in (mock). You’ll be taken to `/select-role`.
6. Pick a role and difficulty, then continue to `/interview`.

## Deploying to Vercel
- From v0: click the “Publish” button in the top-right to deploy directly to Vercel.
- Or push to GitHub and import the repo at https://vercel.com/new.
- No environment variables are required.

## Notes on CORS
These APIs are intended for same-origin use (the Next.js app itself). CORS is permissive for local development convenience. If deploying the frontend and backend on different domains, restrict Access-Control-Allow-Origin to the exact origin.
