# MapAi - Local LLM + Maps Assistant

Technical test implementation for an AI assistant that supports:
- General Q&A chat
- Place search and map recommendations
- Current-location flow
- Persistent chat history and memory

Tech stack:
- Backend: Node.js + Express
- LLM: Ollama local models
- Maps: Google Maps API (primary) + OpenStreetMap fallback
- Frontend: React Native Web (Vite)
- Database: SQLite + Prisma

## 1) Architecture

```txt
┌──────────────────────────────────────────┐
│ Frontend (ui/, Vite, RN Web)            │
│ - Chat UI                               │
│ - Recommendations panel + map           │
│ - Calls /api/* via Vite proxy           │
└───────────────────┬──────────────────────┘
                    │ HTTP
┌───────────────────▼──────────────────────┐
│ Backend (src/, Express)                  │
│ - /api/assistant (chat + map orchestration)
│ - /api/map-query (map-only query)        │
│ - chat sessions/messages API             │
│ - memory clear API                       │
└───────────┬─────────────────────┬────────┘
            │                     │
            │                     ├─ Google Maps API
            │                     └─ OpenStreetMap API (fallback)
            │
            └─ Ollama (local model server)
                     +
               SQLite (Prisma)
```

## 2) Project Structure

```txt
.
├─ src/                       # Express backend
│  ├─ controllers/
│  ├─ routes/
│  ├─ services/
│  └─ db/
├─ prisma/
│  ├─ schema.prisma
│  ├─ dev.db
│  └─ seed.js
├─ ui/                        # React Native Web + Vite
├─ docs/
│  └─ postman/
│     └─ MapAi.postman_collection.json
├─ .env.example
└─ package.json
```

## 3) Prerequisites

- Node.js 18+
- npm
- Ollama running on `http://localhost:11434`
- (Recommended) valid Google Maps API key

## 4) Environment Variables

Create `.env` in project root:

```bash
copy .env.example .env
```

Example values:

```env
PORT=3001
DATABASE_URL="file:./prisma/dev.db"
DEFAULT_LOCATION=Batam
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
MAP_PROVIDER=auto
GOOGLE_MAPS_API_KEY=replace_with_your_google_maps_api_key
OSM_USER_AGENT=heypico-test-map-app/1.0
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
MAX_RECOMMENDATIONS=4
```

Frontend env (`ui/.env`):

```env
VITE_GOOGLE_MAPS_API_KEY=replace_with_your_google_maps_api_key
```

## 5) Installation & Run

### Backend

```bash
npm install
npm run prisma:generate
npm run dev
```

Backend URL:
- `http://localhost:3001`

Health check:
- `GET http://localhost:3001/health`

### Frontend

Open second terminal:

```bash
cd ui
npm install
npm run dev
```

Frontend URL:
- `http://localhost:5173`

Note: Vite proxies `/api/*` to backend `:3001`.

## 6) Database & Seed

Generate Prisma client:

```bash
npm run prisma:generate
```

Optional migration:

```bash
npm run prisma:migrate
```

Seed sample chats:

```bash
npm run db:seed
```

Seeder:
- `prisma/seed.js`

## 7) API Endpoints

### Core
- `GET /health`
- `POST /api/assistant`
- `POST /api/map-query`
- `GET /api/models`

### Chat session
- `POST /api/chats`
- `GET /api/chats?view=active|archived|all`
- `PATCH /api/chats/:chatId` (rename/pin/archive)
- `DELETE /api/chats/:chatId`
- `GET /api/chats/:chatId/messages`

### Memory
- `POST /api/memory/clear`

## 8) Sample Requests

### POST /api/assistant (map search)

```json
{
  "chatId": "demo-chat-map-assistant",
  "prompt": "find coffee shops in Batam",
  "model": "qwen2.5-coder:7b"
}
```

### POST /api/assistant (general chat)

```json
{
  "chatId": "demo-chat-general-qa",
  "prompt": "Explain REST API in simple terms",
  "model": "qwen2.5-coder:7b"
}
```

### POST /api/memory/clear (current chat)

```json
{
  "scope": "current",
  "chatId": "demo-chat-map-assistant"
}
```

## 9) Postman Collection

Import this file into Postman:
- `docs/postman/MapAi.postman_collection.json`

Collection covers:
- health check
- model listing
- chat create/list/update/delete
- chat messages
- assistant (chat/map/current location)
- memory clear

Default variable:
- `baseUrl = http://localhost:3001`

## 10) Troubleshooting

- `ECONNREFUSED` in frontend:
  - ensure backend is running on `:3001`
- `Map is not visible`:
  - check API key in root `.env` and `ui/.env`
  - restart backend/frontend after env changes
  - disable adblock/shield for localhost if Maps requests are blocked
- `No local model found`:
  - run `ollama list`
  - ensure `OLLAMA_BASE_URL` reachable

## 11) Security Notes

- Never commit `.env` with real keys.
- Rotate API key if it was exposed during testing.
- Restrict Google Maps key by:
  - HTTP referrer (`localhost:5173` for dev)
  - API restrictions (Maps JS + Places/Geocoding as needed)
