# Cinema Manager - Deploy Guide (Vercel + Real URL)

This project is a Vite React frontend + json-server backend.

Important:
- Frontend can be deployed to Vercel easily.
- Current backend (`server.cjs` + `db.json`) writes data to file. Vercel serverless is not a good fit for persistent file writes.
- Recommended setup for CV: deploy frontend on Vercel, deploy backend on Render/Railway.

## 1) Prepare project

Run locally first:

```bash
npm install
npm run dev:all
```

Frontend should run at `http://localhost:5173` and backend at `http://localhost:3001`.

## 2) Deploy backend (Render example)

1. Push source code to GitHub.
2. On Render, create a new `Web Service` from this repo.
3. Use these settings:
- Build Command: `npm install`
- Start Command: `node server.cjs`
- Runtime: Node
4. Deploy and copy backend URL, for example:
- `https://cinema-manager-api.onrender.com`
5. Test backend:
- `https://cinema-manager-api.onrender.com/api/movies`

## 3) Deploy frontend to Vercel

1. On Vercel, click `Add New Project` and import this repo.
2. Framework preset: `Vite`.
3. Build settings:
- Build Command: `npm run build`
- Output Directory: `dist`
4. Add Environment Variables in Vercel project settings:
- `VITE_API_BASE_URL=https://<your-backend-domain>/api`
- `VITE_TMDB_V4_TOKEN=<your_tmdb_v4_token>`
- `VITE_TMDB_V3_KEY=<your_tmdb_v3_key>`
- `VITE_N8N_CHAT_URL=<optional_n8n_webhook_url>`
5. Deploy.

After deploy, you will get a real URL like:
- `https://cinema-manager.vercel.app`

## 4) Add URLs to your CV

Use 2 links:
- Live demo (Vercel frontend)
- API endpoint (Render/Railway backend)

Suggested CV line:

"Cinema Manager (React + Redux + TypeScript): built booking flow with seat-hold logic and auth, deployed production demo on Vercel with hosted REST API."

## 5) Notes for production

- Do not commit `.env` to GitHub.
- Keep secrets in Vercel/Render environment variables.
- If you used exposed keys before, rotate them.
