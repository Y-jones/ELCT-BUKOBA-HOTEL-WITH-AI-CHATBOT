const LANG_RE = /^LANG:\s*(en|sw|fr|de)\s*\n+/i;
const HANDOFF_RE = /\n?HANDOFF_READY:\s*(.+?)\s*(?:\n|$)/i;
const SUGGESTIONS_RE = /\n?SUGGESTIONS:\s*(.+?)\s*(?:\n|$)/i;

/**
 * Splits the model's raw completion into what the guest should actually see
 * plus the three structured signals the system prompt asks for. Tolerant of
 * the model skipping a marker (falls back to null / the caller's own
 * language guess) — this is a nice-to-have layer on top of the guardrails,
 * not itself a safety mechanism, so we fail soft rather than erroring out.
 */
function parseModelOutput(rawText) {
  let text = rawText;
  let lang = null;

  const langMatch = text.match(LANG_RE);
  if (langMatch) {
    lang = langMatch[1].toLowerCase();
    text = text.slice(langMatch[0].length);
  }

  let handoffSummary = null;
  const handoffMatch = text.match(HANDOFF_RE);
  if (handoffMatch) {
    handoffSummary = handoffMatch[1].trim();
    text = text.replace(HANDOFF_RE, '\n');
  }

  let suggestions = null;
  const suggestionsMatch = text.match(SUGGESTIONS_RE);
  if (suggestionsMatch) {
    suggestions = suggestionsMatch[1]
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    text = text.replace(SUGGESTIONS_RE, '\n');
  }

  text = text.trim();

  return { text, lang, handoffSummary, suggestions };
}

module.exports = { parseModelOutput };
