# HeyPico Code Test 2

Local LLM + Maps assistant with:
- Node.js/Express backend
- Ollama (local model)
- Google Maps (primary) + OpenStreetMap fallback
- React Native Web UI (Vite)
- SQLite chat memory using Prisma

## Features
- Chat mode and map mode in one `/api/assistant` endpoint.
- Entity-to-map behavior (example: `show singapore on map`).
- Browser location support (`Use Location`).
- Model selector from local Ollama models.
- Persistent chat sessions and messages in SQLite.
- Memory settings: clear current chat or clear all chat memory.

## Project Structure
```txt
.
├─ src/                    # backend source
├─ prisma/                 # Prisma schema, sqlite db, seed script
│  ├─ schema.prisma
│  └─ seed.js
├─ ui/                     # React Native Web frontend (Vite)
├─ .env.example
└─ package.json
```

## Prerequisites
- Node.js 18+
- Ollama running locally (`http://localhost:11434`)
- Google Maps API key (recommended for accurate results)

## Environment Setup
1. Install backend dependencies:
```bash
npm install
```

2. Create `.env` from example:
```bash
copy .env.example .env
```

3. Update `.env` values as needed:
```env
PORT=3001
DATABASE_URL="file:./prisma/dev.db"
DEFAULT_LOCATION=Batam
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
MAP_PROVIDER=auto
GOOGLE_MAPS_API_KEY=your_key_here
OSM_USER_AGENT=heypico-test-map-app/1.0
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
MAX_RECOMMENDATIONS=4
```

## Database (SQLite + Prisma)
Generate Prisma client:
```bash
npm run prisma:generate
```

Optional migration command:
```bash
npm run prisma:migrate
```

Seed dummy English chats/messages:
```bash
npm run db:seed
```

Notes:
- Seeder file: `prisma/seed.js`
- Seeder resets existing chat data (deletes old chats/messages first).

## Run Backend
Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run start
```

Backend URL:
- `http://localhost:3001`

Health check:
- `GET /health`

## Run Frontend (React Native Web)
In a second terminal:
```bash
cd ui
npm install
copy .env.example .env
npm run dev
```

Frontend URL:
- `http://localhost:5173`

Vite proxy forwards `/api/*` requests to backend `:3001`.

## Main API Endpoints
- `POST /api/assistant`
- `POST /api/map-query`
- `GET /api/models`
- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/:chatId/messages`
- `POST /api/memory/clear`

### Assistant request example
```json
{
  "chatId": "demo-chat-map-assistant",
  "prompt": "find coffee shops in Batam",
  "model": "qwen2.5-coder:7b"
}
```

### Assistant map response example
```json
{
  "mode": "map",
  "provider": "google",
  "totalResults": 4,
  "assistantMessage": "Hello! I found 4 recommendations...",
  "places": []
}
```

## Seed Data Included
The seeder creates 3 demo chat sessions in English:
- `Find coffee in Batam`
- `REST API basics`
- `Current location + map`

## Troubleshooting
- `ECONNREFUSED` in Vite proxy:
  - Ensure backend is running on `http://localhost:3001`.
- Map not visible in UI:
  - Ensure `GOOGLE_MAPS_API_KEY` is valid.
  - Restart backend after changing `.env`.
- Local model not listed:
  - Check Ollama is running and model exists (`ollama list`).
- Empty API responses:
  - Try explicit location in prompt, example: `find coffee shops in Batam`.

## Useful Commands
```bash
npm run dev
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run db:seed
```

