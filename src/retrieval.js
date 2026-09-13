const { KB, ATTRACTIONS, buildCorpus, buildDirectory } = require('./corpus');

/**
 * Retrieval for the ELCT Bukoba Hotel knowledge base.
 *
 * This used to be a hand-authored, per-topic system: a chunk-builder
 * function per section (rooms, restaurant, tours...), a manually
 * maintained English synonym dictionary, and a manually maintained list
 * of "intent" keyword patterns. Every new topic (a security policy, a
 * tourist attraction, a new service) meant writing new code here.
 *
 * It's now generic:
 *  1. corpus.js auto-derives chunks from whatever is actually in
 *     data/knowledge_base.json and data/attractions.json — no per-topic
 *     authorship.
 *  2. Relevance ranking is plain BM25 (a standard, well-understood
 *     information-retrieval algorithm) computed over that auto-derived
 *     corpus. Term weights (which words matter) are learned from the
 *     corpus's own statistics, not from a hardcoded synonym list — so it
 *     adapts automatically the moment content changes.
 *  3. A short, always-included "directory" (see corpus.js) covers the
 *     gap BM25 can't: it's a pure lexical/English-leaning method, so a
 *     Swahili/French/German question, or a phrasing nobody anticipated,
 *     may not score highly against any single detail chunk. The
 *     directory guarantees the model still knows the full shape of what
 *     the hotel and the area offer, and lets it *reason* its way to a
 *     helpful partial answer instead of an English-keyword-matching
 *     engine deciding for it. See systemPrompt.js for how that's used.
 */

const CHUNKS = buildCorpus();
const DIRECTORY_TEXT = buildDirectory();

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// ------------------------------------------------------------
// BM25
// ------------------------------------------------------------

const DOC_TOKENS = CHUNKS.map((c) => tokenize(c.text));
const N = DOC_TOKENS.length || 1;
const AVG_LEN = DOC_TOKENS.reduce((s, t) => s + t.length, 0) / N;

const DOC_FREQ = new Map();
DOC_TOKENS.forEach((tokens) => {
  new Set(tokens).forEach((t) => DOC_FREQ.set(t, (DOC_FREQ.get(t) || 0) + 1));
});

function idf(term) {
  const df = DOC_FREQ.get(term) || 0;
  return Math.log(1 + (N - df + 0.5) / (df + 0.5));
}

const K1 = 1.5;
const B = 0.75;

function bm25Score(queryTokens, docTokens) {
  if (!docTokens.length) return 0;
  const tf = new Map();
  docTokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));

  let score = 0;
  for (const term of queryTokens) {
    const f = tf.get(term) || 0;
    if (!f) continue;
    const denom = f + K1 * (1 - B + (B * docTokens.length) / AVG_LEN);
    score += idf(term) * ((f * (K1 + 1)) / denom);
  }
  return score;
}

// ------------------------------------------------------------
// RETRIEVE
// ------------------------------------------------------------

function retrieveContext(query, { topK = 4 } = {}) {
  const queryTokens = tokenize(query);

  const scored = CHUNKS.map((chunk, i) => ({
    chunk,
    score: bm25Score(queryTokens, DOC_TOKENS[i]),
  })).sort((a, b) => b.score - a.score);

  let top = scored.filter((s) => s.score > 0).slice(0, topK).map((s) => s.chunk);

  if (top.length === 0) {
    // Nothing scored (e.g. a non-English phrasing BM25 can't match, or a
    // greeting) — the directory in the system prompt still covers the
    // guest, so an empty detail set is fine here rather than guessing.
    top = [];
  }

  console.log(
    '[retrieval] bm25',
    JSON.stringify(query),
    '=>',
    scored.slice(0, 6).map((s) => `${s.chunk.id}:${s.score.toFixed(2)}`).join(', ')
  );

  return top;
}

module.exports = {
  KB,
  ATTRACTIONS,
  CHUNKS,
  DIRECTORY_TEXT,
  retrieveContext,
  tokenize,
};
