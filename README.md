# Path of VO

A web app that helps voice artists detect when AI companies are using their voice without permission.

## How it works

1. A voice artist uploads a short audio sample of their voice
2. The app fingerprints it using [resemblyzer](https://github.com/resemble-ai/Resemblyzer), generating a 256-dimensional voice embedding
3. Two scans run in parallel via Celery:
   - **URL scan** — downloads audio from a suspicious URL the artist pastes, fingerprints it, and compares embeddings
   - **Name scan** — searches ElevenLabs for voices matching the artist's name, downloads samples, and compares embeddings
4. Cosine similarity is computed between the artist's embedding and each result
5. Results are ranked by confidence score and returned to the frontend

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scans` | Submit a new scan (audio + artist name + optional URL) |
| `GET` | `/scans/{scan_id}` | Poll for scan status and results |
| `GET` | `/scans` | Get the authenticated user's scan history |

## Prerequisites

- Python 3.11+
- Node.js 18+
- Redis (for Celery task queue)

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

Create a `.env` file in the `backend/` directory:

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_BUCKET_NAME=audio
CLERK_SECRET_KEY=sk_test_...
```

Run the database migrations:

```bash
alembic upgrade head
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Start the Celery worker (in a separate terminal, inside `backend/` with venv active):

```bash
celery -A workers.celery_app worker --loglevel=info
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

## Services needed

| Service | Purpose | Free tier |
|---|---|---|
| [Neon](https://neon.tech) | Postgres database | Yes |
| [Supabase](https://supabase.com) | Audio file storage | Yes |
| [Clerk](https://clerk.com) | Authentication | Yes |
| [Redis](https://redis.io) | Celery task queue | Run locally |
| [ElevenLabs](https://elevenlabs.io) | Voice search API | Yes |
