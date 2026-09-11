# ELCT Bukoba Hotel & Tours — AI Assistant Backend

Groq + lightweight RAG backend for the ELCT BUKOBA HOTEL AI ASSISTANT widget.

## Quick start

```bash
npm install
cp .env.example .env
# edit .env and add your GROQ_API_KEY (get one at https://console.groq.com)
npm start
```

Server runs on `http://localhost:3001` by default. Check it's alive:

```bash
curl http://localhost:3001/api/health
```

Then point the widget at it — in `widget/widget.js`, set:

```js
var BACKEND_URL = 'http://localhost:3001';   // or your deployed URL
```

If `BACKEND_URL` is left empty, or the backend is unreachable, the widget
automatically falls back to its built-in local demo matcher — the widget
never breaks, it just gets smarter once the backend is live.

## How it works

```
Guest message
     │
     ▼
guardrails.preCheck()  ──── competitor request? ────► fixed safe reply (no Groq call)
     │ no
     ▼
retrieval.retrieveContext()  → picks the 4 most relevant chunks
     │                          of knowledge_base.json by keyword match
     ▼
systemPrompt.buildSystemPrompt()  → base rules + only the retrieved context
     │
     ▼
groqClient.chatCompletion()  → calls Groq's chat completions API
     │
     ▼
guardrails.postCheck()  ──── model named a competitor anyway? ────► fixed safe reply
     │ no
     ▼
Reply sent to widget
```

### Why keyword retrieval instead of a vector database

The knowledge base is ~30KB total. A full embeddings + vector-DB pipeline
would add cost, latency, and moving parts for no real benefit at this size.
`src/retrieval.js` scores hand-built chunks (rooms, each menu category,
car hire, conference, tour, extra services, contact/locations, policies)
against the query by keyword overlap and returns the top 4. If the
knowledge base grows a lot later, swap the scoring function for real
embeddings — `retrieveContext()` is the only function the rest of the app
calls, so nothing else needs to change.

### Why the competitor policy isn't "just the system prompt"

`src/guardrails.js` runs independently of the model:
- **preCheck** catches obvious competitor-recommendation phrasing before
  Groq is even called (works even if Groq is down, and costs zero tokens).
- **postCheck** scans the model's actual reply for signs it ignored the
  system prompt, and substitutes a safe response if so.

Both layers are intentionally narrow — they match recommendation/comparison
language, not general geography, so "how do I get to the hotel from
Mwanza" is never blocked.

### Hallucination control

The model is only ever shown the retrieved chunks of
`knowledge_base.json` as fact — never asked to answer from general
knowledge. The system prompt explicitly instructs it to say "I don't have
that information" rather than guess, and to caveat published prices as
reference figures pending confirmation.

## What's customized (beyond the base RAG pipeline)

- **Persona** (`systemPrompt.js`) — a defined East African hospitality voice
  (warm, natural "Karibu" openers, genuine sign-offs), not generic
  chatbot-speak. Still concise — it's a chat widget, not an essay.
- **Booking handoff via WhatsApp** — once the model has gathered enough
  booking info (room type + dates, minimum), it emits a structured
  `HANDOFF_READY: <summary>` marker. `responseParser.js` extracts it,
  `whatsapp.js` builds a `wa.me` link from the **real** hotel number in
  `knowledge_base.json` (never from anything the model says) pre-filled
  with the summary, and the widget renders it as a one-tap button.
- **Contextual follow-up chips** — the model can also emit
  `SUGGESTIONS: chip one | chip two | chip three`, parsed the same way,
  rendered as tappable chips under that reply so the guest doesn't have to
  think of what to type next.
- **Model-reported language** — every reply starts with a `LANG: xx`
  marker the model sets itself (more reliable than guessing from regex),
  parsed out before display and used to auto-sync the widget's EN/SW/FR/DE
  toggle to match whatever the guest actually typed in.
- **"Talk to a human"** — always-visible chip, independent of the backend
  entirely (built client-side from the same real WhatsApp number in
  `knowledge.js`), so it works even if the backend is down.

All three markers are parsed server-side and never shown raw to the guest —
if the model forgets one (it sometimes will), the app degrades gracefully:
no handoff button, no suggestion chips, language falls back to the regex
guess in `guardrails.js`. None of this is a safety mechanism — the
guardrails layer above is unaffected by any of it.

### Token cost of the added persona/format instructions

The richer system prompt runs ~675 tokens on its own (vs. ~325 before),
so a typical request is now ~1,400-1,800 tokens instead of ~1,000-1,400 —
still comfortably inside the free tier's 6,000 tokens/minute, just closer
to 3-4 requests/minute than 4-6. If that ever feels tight, the first things
to trim are the OUTPUT FORMAT instructions (drop SUGGESTIONS if you don't
want follow-up chips) rather than the persona or the business rules.

### The three structured markers

The system prompt asks the model to prefix/suffix its reply with three
machine-readable markers, parsed out by `src/responseParser.js` before the
guest ever sees them:

- `LANG: xx` (first line, always) — which of the 4 languages it detected.
  Used instead of the old regex-only guess, and returned to the widget so
  it can sync its language toggle to match the conversation automatically.
- `HANDOFF_READY: <summary>` (only once there's enough booking info) —
  triggers `src/whatsapp.js` to build a real `wa.me` deep link from the
  hotel's actual WhatsApp number (never from anything the model generated)
  pre-filled with the request, so the guest taps once instead of retyping
  everything into WhatsApp themselves.
- `SUGGESTIONS: a | b | c` (when natural) — 2-3 short follow-up questions,
  rendered as tappable chips under that reply so the conversation has
  somewhere to go next instead of guests staring at an empty input box.

All three are optional — the model is told to omit any that don't apply,
and the parser fails soft (falls back to the guardrails' regex language
guess, no WhatsApp button, no chips) if a marker is missing or malformed
rather than erroring out.

### "Talk to a human"

Deliberately **not** a backend feature — it's a fixed quick-action chip in
`widget/widget.js` that builds a `wa.me` link straight from
`knowledge.js`'s copy of the hotel's WhatsApp number and opens it directly.
No backend round-trip, so it keeps working even if the backend is down or
unreachable — which is exactly when a guest most needs a human escape
hatch.

### Free-tier token budget (why the numbers are what they are)

Groq's free tier: **30 requests/min, 6,000 tokens/min, 14,400 requests/day**,
shared across models at the org level — and you hit whichever limit comes
first. With the defaults in `.env.example`:

- Model: `llama-3.1-8b-instant` (fast, cheap, plenty capable for grounded
  concierge Q&A — not `llama-3.3-70b-versatile`, which is heavier per token)
- System prompt + 3 retrieved chunks: ~750 tokens
- Reply cap: 300 tokens
- A typical request (with a little conversation history): **~1,000-1,400
  tokens total**

That leaves room for roughly 4-6 requests/minute before the 6K TPM ceiling,
not the 2-3/minute you'd get with the 70B model and looser defaults. On top
of that:
- **In-memory response cache** (`groqClient.js`) — repeated single-turn
  questions ("what rooms do you have") are served from cache for 10 minutes
  without calling Groq again at all.
- **One retry on HTTP 429** with the `Retry-After` header respected, capped
  at a 4-second wait — beyond that it fails fast to the graceful fallback
  message rather than making a guest wait.
- Server-side rate limiting (`RATE_LIMIT_MAX=20/min` by default) stays under
  Groq's own 30 RPM so you get clean 429s from your own server instead of
  cascading failures from Groq.

If you outgrow the free tier, bump `GROQ_MODEL` to `llama-3.3-70b-versatile`
and/or add a card on Groq's side (~10x the limits) — nothing else changes.

## Environment variables

See `.env.example`. The important ones:

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Your Groq key. Required — without it, `/api/chat` returns the graceful fallback message for every request. |
| `GROQ_MODEL` | Defaults to `llama-3.3-70b-versatile`. Change without touching code. |
| `ALLOWED_ORIGINS` | Comma-separated list of domains allowed to call this API. Set this to your real hotel domain(s) before going live — defaults to `*` for local dev. |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | Basic abuse/free-tier protection. |

## Deployment

This is a plain Node/Express app — no deployment target was locked in yet,
so it'll run anywhere that runs Node: a VPS, Render, Railway, Fly.io,
a Docker container, etc. Whatever you pick:

1. Set `GROQ_API_KEY` and `ALLOWED_ORIGINS` as real environment variables
   (never commit `.env`).
2. Run `npm install --omit=dev && npm start`.
3. Update `BACKEND_URL` in the widget to the deployed URL.
4. Serve the widget over HTTPS if your backend is HTTPS — mixed content
   will get blocked by browsers otherwise.

## Not built yet (by design, per the earlier architecture discussion)

- **Maps/routing** — no live distance/directions lookup. The assistant
  will say so honestly if asked.
- **Real booking/availability** — the hotel's real booking system
  (`bukobahotel.elctnwd.or.tz`) is treated as a hand-off point, not called
  directly. The assistant collects intent and directs guests there.
- **Conversation persistence across sessions** — history is passed in from
  the widget per-request (session-only), not stored server-side.

## Testing it

```bash
# Health check
curl http://localhost:3001/api/health

# Normal question (needs GROQ_API_KEY set to get a real answer)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"what rooms do you have"}'

# Competitor deflection (works even without GROQ_API_KEY — blocked before Groq)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"whats the best restaurant in bukoba"}'
```
