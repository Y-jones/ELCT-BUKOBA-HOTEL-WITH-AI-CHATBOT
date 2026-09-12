const Groq = require('groq-sdk');

let client = null;

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  if (!client) {
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return client;
}

// Controlled through .env.
// Example:
// GROQ_MODEL=openai/gpt-oss-20b
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

const MAX_TOKENS = parseInt(
  process.env.GROQ_MAX_TOKENS || '300',
  10
);

const TEMPERATURE = parseFloat(
  process.env.GROQ_TEMPERATURE || '0.4'
);

// Tiny in-memory cache.
// Repeated single-turn questions can reuse a recent answer and reduce
// unnecessary API calls.
const CACHE_TTL_MS = parseInt(
  process.env.GROQ_CACHE_TTL_MS || '600000',
  10
);

const cache = new Map();

function cacheKey(message) {
  return message
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getCached(message) {
  const key = cacheKey(message);
  const hit = cache.get(key);

  if (!hit) {
    return null;
  }

  if (Date.now() - hit.time > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return hit.value;
}

function setCached(message, value) {
  const key = cacheKey(message);

  cache.set(key, {
    value,
    time: Date.now(),
  });

  // Prevent unbounded cache growth.
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

/**
 * Calls Groq's Chat Completions API.
 *
 * Keeps the prompt compact by sending:
 * - the system prompt
 * - the last few conversation messages
 * - the current user message
 *
 * Single-turn questions can use the in-memory cache.
 */
async function chatCompletion({
  systemPrompt,
  history = [],
  userMessage,
  cacheable = true,
}) {
  const isFreshQuestion = history.length === 0 && cacheable;

  if (isFreshQuestion) {
    const cached = getCached(userMessage);

    if (cached) {
      console.log('[groq] Returning cached response');

      return {
        ...cached,
        cached: true,
      };
    }
  }

  const groq = getClient();

  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },

    ...history
      .slice(-4)
      .map((m) => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text,
      })),

    {
      role: 'user',
      content: userMessage,
    },
  ];

  const result = await callWithRetry(groq, messages);

  if (isFreshQuestion) {
    setCached(userMessage, result);
  }

  return result;
}

async function callWithRetry(
  groq,
  messages,
  attempt = 0
) {
  try {
    const completion =
      await groq.chat.completions.create({
        model: MODEL,
        messages,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      });

    const choice =
      completion.choices &&
      completion.choices[0];

    const text =
      choice &&
      choice.message &&
      choice.message.content;

    // TEMPORARY DEBUGGING LOGS
    console.log(
      '[groq] MODEL:',
      MODEL
    );

    console.log(
      '[groq] RAW COMPLETION:',
      JSON.stringify(text)
    );

    console.log(
      '[groq] FINISH REASON:',
      choice && choice.finish_reason
    );

    console.log(
      '[groq] USAGE:',
      completion.usage || null
    );

    if (!text) {
      throw new Error(
        'Empty completion from Groq'
      );
    }

    return {
      text,
      model: MODEL,
      usage: completion.usage || null,
    };
  } catch (err) {
    const status =
      err &&
      (err.status || err.statusCode);

    // Retry once for short rate-limit waits.
    if (
      status === 429 &&
      attempt === 0
    ) {
      const retryAfterHeader =
        err.headers &&
        err.headers['retry-after'];

      const waitMs =
        retryAfterHeader
          ? Number(retryAfterHeader) * 1000
          : 1500;

      if (waitMs <= 4000) {
        await new Promise(
          (resolve) =>
            setTimeout(resolve, waitMs)
        );

        return callWithRetry(
          groq,
          messages,
          attempt + 1
        );
      }
    }

    throw err;
  }
}

module.exports = {
  chatCompletion,
  MODEL,
};
