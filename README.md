# SigmaGPT

A MERN-style chat assistant that writes answers using **free and open model APIs**.
It runs with no API key and no database, and scales up to either when you want them.

![stack](https://img.shields.io/badge/React-19-61dafb) ![stack](https://img.shields.io/badge/Express-5-000000) ![stack](https://img.shields.io/badge/MongoDB-optional-4faa41)

---

## Quick start

```bash
npm install --prefix Backend && npm run dev --prefix Backend
```

```bash
npm install --prefix Frontend && npm run dev --prefix Frontend
```

Open http://localhost:5173. There is nothing else to configure — no API key, no
MongoDB. The frontend proxies `/api` to the backend on port 8080, so no CORS
setup or hardcoded URLs are involved.

> The zero-config provider (Pollinations) is an anonymous, rate-limited
> community gateway. It is perfect for a first run, but for day-to-day use add
> one free API key as shown below.

---

## Answer providers

The backend talks to a small set of interchangeable providers. All of them are
free; the ones that need a key issue it without a credit card.

| Provider | Key needed | Notes |
| --- | --- | --- |
| **Pollinations** | none | Works out of the box. Anonymous tier is rate limited. |
| **Groq** | `GROQ_API_KEY` | Fastest option. Open Llama models on LPUs. |
| **Google Gemini** | `GEMINI_API_KEY` | Generous free tier, long context. |
| **OpenRouter** | `OPENROUTER_API_KEY` | Community models; defaults to a `:free` one. |
| **Hugging Face** | `HF_TOKEN` | Free inference credits for open-weight models. |
| **Ollama** | none | Fully offline open weights on your own machine. |

Copy the example env file and add whichever key you have:

```bash
cp Backend/.env.example Backend/.env
```

Any provider with a key is used first, and the rest act as automatic fallbacks —
if one is down, rate limited, or returns an empty answer, the next one takes
over mid-request. Pin the order explicitly with `PROVIDER_ORDER=groq,gemini`.
You can also pick a specific provider from the picker in the app header.

---

## Storage

Set `MONGODB_URI` to use MongoDB. Leave it empty and chats persist to
`Backend/.data/threads.json` instead, so the app works without a database. If a
configured MongoDB is unreachable at startup, the server logs a warning and
falls back to file storage rather than refusing to boot.

---

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Status, active provider and storage backend |
| `GET` | `/api/providers` | Provider list with readiness, for the UI picker |
| `GET` | `/api/thread` | All threads, newest first |
| `GET` | `/api/thread/:id` | Messages in one thread |
| `PATCH` | `/api/thread/:id` | Rename a thread |
| `DELETE` | `/api/thread/:id` | Delete a thread |
| `POST` | `/api/chat` | Answer in one JSON response |
| `POST` | `/api/chat/stream` | Answer streamed over Server-Sent Events |

`POST /api/chat/stream` emits `meta` (which provider is answering), `delta`
(text chunks), and then `done` or `error`. Disconnecting cancels the upstream
request, and whatever was generated up to that point is still saved.

```bash
curl -N -X POST http://localhost:8080/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"threadId":"demo","message":"Explain closures in JavaScript"}'
```

---

## Features

- Streamed answers with a stop button; partial answers are kept, not discarded
- Full conversation history is sent to the model, so follow-up questions work
- Light and dark themes, remembered across reloads
- Markdown with GitHub tables, themed syntax highlighting and per-block copy
- Chats grouped by date, searchable, renameable, deletable
- Regenerate the last answer
- Responsive down to mobile, with the sidebar as a drawer

---

## Project layout

```
Backend/
  config/      environment and defaults
  providers/   one adapter per free API + the fallback chain
  services/    prompt assembly, streaming, persistence
  store/       MongoDB store and the JSON file fallback
  routes/      REST + SSE endpoints
Frontend/
  src/components/  UI
  src/context/     chat state
  src/lib/         API client and helpers
  src/styles/      design tokens and base styles
```
