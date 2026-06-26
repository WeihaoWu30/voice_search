# Path of VO

A web app that helps voice artists detect when AI companies are using their voice without permission.

## What works right now

- **Name scan** — searches ElevenLabs by artist name, downloads preview audio for each match, fingerprints it, and compares against the artist's uploaded sample using cosine similarity
- **URL scan** — if an ElevenLabs voice URL is pasted, extracts the voice ID, fetches the preview audio, and runs the same comparison
- **Auth** — Clerk sign in/sign up, all scan routes are protected
- **Scan history** — authenticated users can view all their past scans

## Known limitations

- Name scan only searches ElevenLabs' 21 default voices — user-cloned voices in the Voice Library require a paid ElevenLabs plan
- URL scan only works for default ElevenLabs voice URLs, not Voice Library voices (same free tier restriction)

## How it works

1. Artist signs in and uploads a short audio sample + enters their name
2. The backend fingerprints the audio using [resemblyzer](https://github.com/resemble-ai/Resemblyzer), producing a 256-dimensional voice embedding
3. Two Celery tasks run in parallel:
   - **Name scan** — searches ElevenLabs for voices matching the artist's name, downloads preview audio, fingerprints each, computes cosine similarity
   - **URL scan** — if a suspicious URL was pasted, extracts the voice ID, downloads preview audio, runs the same comparison
4. Results with confidence scores are stored in Postgres and returned to the frontend via polling

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scans` | Submit a scan (multipart: audio file + artist name + optional URL) |
| `GET` | `/scans/{scan_id}` | Poll for scan status and results |
| `GET` | `/scans` | Get the authenticated user's scan history |

All routes require a Clerk JWT in the `Authorization: Bearer <token>` header.

## Prerequisites

- Python 3.11+
- Node.js 18+

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/WeihaoWu30/path_of_vo.git
cd path_of_vo
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
DATABASE_URL=postgresql://...
REDIS_URL=rediss://:your-upstash-password@your-host.upstash.io:6379
CLERK_SECRET_KEY=sk_test_...
ELEVENLABS_API_KEY=...
```

Run the database migration:

```bash
alembic upgrade head
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Start the Celery worker in a separate terminal:

```bash
celery -A workers.celery_app worker --loglevel=info
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Services

| Service | Purpose | Free tier |
|---|---|---|
| [Neon](https://neon.tech) | Postgres database | Yes |
| [Upstash](https://upstash.com) | Hosted Redis for Celery | Yes |
| [Clerk](https://clerk.com) | Authentication | Yes |
| [ElevenLabs](https://elevenlabs.io) | Voice search API | Yes (limited) |
