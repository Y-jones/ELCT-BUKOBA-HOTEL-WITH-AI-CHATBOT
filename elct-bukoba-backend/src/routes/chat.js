const express = require('express');
const { retrieveContext, KB } = require('../retrieval');
const { buildSystemPrompt } = require('../systemPrompt');
const { preCheck, postCheck, detectLang } = require('../guardrails');
const { chatCompletion } = require('../groqClient');
const { parseModelOutput } = require('../responseParser');
const { buildHandoffLink } = require('../whatsapp');

const router = express.Router();

const FALLBACK_MESSAGE = {
  en: "Sorry, I'm temporarily unable to process your request. Please try again shortly, or contact the hotel directly.",
  sw: 'Samahani, kwa sasa siwezi kushughulikia ombi lako. Tafadhali jaribu tena baadaye, au wasiliana na hoteli moja kwa moja.',
  fr: "Désolé, je ne peux pas traiter votre demande pour le moment. Merci de réessayer sous peu, ou contactez l'hôtel directement.",
  de: 'Entschuldigung, ich kann Ihre Anfrage momentan nicht bearbeiten. Bitte versuchen Sie es später erneut oder kontaktieren Sie das Hotel direkt.',
};

function buildContextText(chunks) {
  return chunks.map((c) => `[${c.category}] ${c.text}`).join('\n\n');
}

router.post('/chat', async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'message is too long' });
  }

  // 1. Business-logic pre-check — independent of the LLM
  const pre = preCheck(message);
  if (pre) {
    return res.json({ reply: pre.reply, lang: pre.lang, source: 'guardrail', chunks_used: [] });
  }

  // 2. Retrieval — only the relevant slice of the knowledge base.
  // topK=3 (not more) keeps input tokens well within the free tier's
  // 6,000 tokens/minute cap alongside the compact system prompt above.
  const chunks = retrieveContext(message, { topK: 3 });
  const systemPrompt = buildSystemPrompt({ contextText: buildContextText(chunks) });

  try {
    const completion = await chatCompletion({
      systemPrompt,
      history: Array.isArray(history) ? history : [],
      userMessage: message,
    });

    // Pull the LANG / HANDOFF_READY / SUGGESTIONS markers back out before
    // anything else sees the text — postCheck and the guest both only ever
    // see the cleaned reply.
    const parsed = parseModelOutput(completion.text);
    const lang = parsed.lang || detectLang(message);

    // 3. Business-logic post-check — catch anything the model got wrong anyway
    const checked = postCheck(parsed.text, message);

    const response = {
      reply: checked.reply,
      lang,
      source: checked.safe ? 'groq' : 'guardrail_postcheck',
      model: completion.model,
      chunks_used: chunks.map((c) => c.id),
    };

    // Only build the WhatsApp handoff link when the model signaled it has
    // enough info AND the post-check didn't override the reply — a swapped
    // safe-reply has nothing to do with the (possibly stale) handoff summary.
    if (checked.safe && parsed.handoffSummary) {
      response.whatsapp_url = buildHandoffLink(KB.contact.whatsapp, parsed.handoffSummary, lang);
      response.handoff_summary = parsed.handoffSummary;
    }
    if (checked.safe && parsed.suggestions && parsed.suggestions.length) {
      response.suggestions = parsed.suggestions;
    }

    return res.json(response);
  } catch (err) {
    console.error('[chat] Groq call failed:', err.message);
    const lang = detectLang(message);
    return res.status(200).json({
      reply: FALLBACK_MESSAGE[lang],
      lang,
      source: 'error_fallback',
      chunks_used: [],
    });
  }
});

module.exports = router;
