/**
 * Guardrails — the "don't rely solely on prompting" layer.
 *
 * Two checks:
 *  - preCheck(query): catches obvious competitor-recommendation requests
 *    BEFORE calling Groq at all, and answers directly from a fixed,
 *    hotel-safe response. Saves a token spend on requests we already know
 *    the answer to, and guarantees the policy even if Groq is unreachable.
 *  - postCheck(reply): scans the model's actual output for named competitor
 *    categories or hedge language that suggests it ignored the system
 *    prompt, and swaps in the safe fallback if so.
 *
 * Neither check tries to be clever about geography — "how do I get to the
 * hotel from Mwanza" must never be blocked. Patterns are scoped to
 * recommendation/comparison language specifically.
 */

const COMPETITOR_INTENT_PATTERNS = [
  /best\s+(hotel|restaurant|lodge|guesthouse|resort|bar)s?\s+(in|near|around)/i,
  /other\s+(hotel|restaurant|lodge|guesthouse)s?\s+(nearby|near|in|around)/i,
  /another\s+(hotel|restaurant|lodge|guesthouse)/i,
  /recommend\s+(a|an|some|another)?\s*(hotel|restaurant|lodge|guesthouse|resort|bar)/i,
  /somewhere\s+else\s+to\s+(eat|stay|drink)/i,
  /better\s+than\s+(elct|this\s+hotel|you|here)/i,
  /alternative\s+(hotel|restaurant|lodge|place\s+to\s+stay)/i,
  /where\s+else\s+(can|could|should)\s+i\s+(eat|stay)/i,
  /(hotel|restaurant)s?\s+you\s+(don'?t|do\s+not)\s+(work\s+for|own)/i, // trying to route around the policy
];

const SAFE_DEFLECTION = {
  en: "ELCT Bukoba Hotel & Tours has its own restaurant, cafés, and accommodation right here — I'd recommend our dining and rooms rather than pointing you elsewhere. Happy to walk you through our menu or room options.",
  sw: "ELCT Bukoba Hotel & Tours ina mkahawa wake, mikahawa midogo, na malazi hapa hapa — ningependekeza chakula na vyumba vyetu badala ya kukuelekeza sehemu nyingine. Niko tayari kukueleza kuhusu menyu au vyumba vyetu.",
  fr: "ELCT Bukoba Hotel & Tours dispose de son propre restaurant, de cafés et d'hébergements sur place — je recommande plutôt notre restauration et nos chambres. Je peux vous présenter notre menu ou nos options de chambres.",
  de: "ELCT Bukoba Hotel & Tours hat ein eigenes Restaurant, Cafés und Unterkünfte direkt vor Ort — ich empfehle lieber unser Restaurant und unsere Zimmer. Gerne zeige ich Ihnen unsere Speisekarte oder Zimmeroptionen.",
};

function detectLang(text) {
  // Very light heuristic — good enough to pick which canned deflection to use;
  // the real language matching for normal replies happens inside the Groq prompt.
  const t = text.toLowerCase();
  if (/[ñçäöüß]|karibu|chakula|vyumba|nini|kuhusu/.test(t) && /wa|na|kwa|hapa/.test(t)) return 'sw';
  if (/\b(le|la|les|des|est|avec|chambre|restaurant\?)\b/.test(t) && /[ àéèêç]/.test(t)) return 'fr';
  if (/\b(und|ist|mit|zimmer|wie)\b/.test(t) && /[äöüß]/.test(t)) return 'de';
  return 'en';
}

function preCheck(query) {
  const isCompetitorRequest = COMPETITOR_INTENT_PATTERNS.some((re) => re.test(query));
  if (!isCompetitorRequest) return null;
  const lang = detectLang(query);
  return { blocked: true, reply: SAFE_DEFLECTION[lang] || SAFE_DEFLECTION.en, lang };
}

// Words/phrases that would indicate the model named or praised a competitor
// despite instructions — kept intentionally narrow to avoid false positives
// on legitimate geography answers (e.g. mentioning "Mwanza" is fine).
const OUTPUT_RED_FLAGS = [
  /\btry\s+(the\s+)?[A-Z][a-zA-Z' ]+\s+(hotel|restaurant|lodge|guesthouse)\b/,
  /\bi\s+recommend\s+[A-Z][a-zA-Z' ]+\s+(hotel|restaurant|lodge)\b/i,
  /\b(is|are)\s+better\s+than\s+(elct|us|this\s+hotel)\b/i,
];

function postCheck(replyText, originalQuery) {
  const flagged = OUTPUT_RED_FLAGS.some((re) => re.test(replyText));
  if (!flagged) return { safe: true, reply: replyText };
  const lang = detectLang(originalQuery);
  return { safe: false, reply: SAFE_DEFLECTION[lang] || SAFE_DEFLECTION.en };
}

module.exports = { preCheck, postCheck, detectLang, COMPETITOR_INTENT_PATTERNS };
