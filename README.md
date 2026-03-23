# HeyPico Test - Local LLM + Google Maps API

This project is a minimal backend for Code Test 2:

- Runs with local LLM (Ollama)
- Extracts location intent from user prompt
- Queries Google Maps Places API (primary)
- Supports OpenStreetMap fallback (secondary)
- Returns place data with Google Maps link and embeddable map URL

## Tech Stack

- Node.js + Express
- Ollama (local LLM)
- Google Maps Places API
- OpenStreetMap (Nominatim)
- Zod (input validation)
- express-rate-limit (usage limits)

## Prerequisites

- Node.js 18+
- Ollama running locally
- Google Maps API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
copy .env.example .env
```

3. Update `.env` with your own `GOOGLE_MAPS_API_KEY`.
   You can set `DEFAULT_LOCATION` to handle prompts without explicit location.

Map provider modes:

- `MAP_PROVIDER=google` -> Google only
- `MAP_PROVIDER=osm` -> OpenStreetMap only
- `MAP_PROVIDER=auto` -> Try Google first, fallback to OpenStreetMap

4. Start server:

```bash
npm run start
```

Server runs on `http://localhost:3001` by default.

## API

### Health Check

`GET /health`

### Map Query

`POST /api/map-query`

Request body:

```json
{
  "prompt": "find coffee shops in Batam"
}
```

### Assistant (Auto mode: Chat or Map)

`POST /api/assistant`

Request:

```json
{
  "prompt": "explain what REST API is"
}
```

Possible response (chat mode):

```json
{
  "mode": "chat",
  "prompt": "explain what REST API is",
  "answer": "..."
}
```

Possible response (map mode):

```json
{
  "mode": "map",
  "prompt": "find coffee shops in Batam",
  "intent": { "query": "coffee shops", "location": "Batam", "placeType": "cafe" },
  "provider": "openstreetmap",
  "totalResults": 5,
  "places": []
}
```

Response (example):

```json
{
  "prompt": "find coffee shops in Batam",
  "intent": {
    "query": "coffee shops",
    "location": "Batam",
    "placeType": "cafe"
  },
  "provider": "google",
  "requestQuery": "coffee shops in Batam",
  "totalResults": 5,
  "places": [
    {
      "name": "Example Cafe",
      "formattedAddress": "Batam, Indonesia",
      "rating": 4.4,
      "location": { "lat": 1.1, "lng": 104.0 },
      "mapsUrl": "https://www.google.com/maps/search/?api=1&query=...",
      "embedUrl": "https://www.google.com/maps?q=...&output=embed"
    }
  ]
}
```

If user context is too generic (for example: `find coffee` without area), API may return:

```json
{
  "needsClarification": true,
  "clarificationQuestion": "Please specify the city or area first..."
}
```

## Security / Best Practices Included

- API keys are loaded from environment variables
- Rate limit applied for `/api/*` routes
- Input validation using Zod
- Request timeout for external API calls
- Basic error handling with safe response format
- Fallback provider strategy for resiliency

## Notes

- This project uses Google Places Text Search endpoint as the primary provider.
- OpenStreetMap is available as secondary fallback when `MAP_PROVIDER=auto`.
- For production use, restrict your API key by:
  - API restrictions (allow only required Google APIs)
  - App/IP restrictions
