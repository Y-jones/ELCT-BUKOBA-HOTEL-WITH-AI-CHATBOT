const express = require('express');
const { retrieveContext, KB, DIRECTORY_TEXT } = require('../retrieval');
const { buildSystemPrompt } = require('../systemPrompt');
const { preCheck, postCheck, detectLang } = require('../guardrails');
const { chatCompletion } = require('../groqClient');
const { parseModelOutput, trimToLastSentence } = require('../responseParser');
const { createBooking, createServiceRequest } = require('../bookingService');
const { bookingTicketText } = require('../whatsapp');
const { query: dbQuery } = require('../db');
const { buildHandoffLink } = require('../whatsapp');

const router = express.Router();

const FALLBACK_MESSAGE = {
  en: "Sorry, I'm temporarily unable to process your request. Please try again shortly, or contact the hotel directly.",
  sw: 'Samahani, kwa sasa siwezi kushughulikia ombi lako. Tafadhali jaribu tena baadaye, au wasiliana na hoteli moja kwa moja.',
  fr: "Désolé, je ne peux pas traiter votre demande pour le moment. Merci de réessayer sous peu, ou contactez l'hôtel directement.",
  de: 'Entschuldigung, ich kann Ihre Anfrage momentan nicht bearbeiten. Bitte versuchen Sie es später erneut oder kontaktieren Sie das Hotel direkt.',
};

function buildContextText(chunks) {
  return chunks.map((c) => c.text).join('\n\n');
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
  const chunks = retrieveContext(message, { topK: 4 });
  const systemPrompt = buildSystemPrompt({
    directoryText: DIRECTORY_TEXT,
    contextText: buildContextText(chunks),
  });

  try {
    const safeHistory = Array.isArray(history) ? history : [];
    const looksLikeBooking = /\b(book|booking|reserve|reservation|room|stay|check[- ]?in|check[- ]?out|availability|car hire|rent a car|conference|hall|tour|safari|laundry|airport pickup|service request)\b/i.test(
      `${safeHistory.map((m) => m && m.text ? m.text : '').join(' ')} ${message}`
    );
    const completion = await chatCompletion({
      systemPrompt,
      history: safeHistory,
      userMessage: message,
      cacheable: !looksLikeBooking,
    });

    // Pull the LANG / HANDOFF_READY / SUGGESTIONS markers back out before
    // anything else sees the text — postCheck and the guest both only ever
    // see the cleaned reply.
    const parsed = parseModelOutput(completion.text);
    const lang = parsed.lang || detectLang(message);

    // Belt-and-braces: if Groq cut the completion off mid-sentence
    // (finish_reason "length"), never show that to the guest — trim back
    // to the last full sentence instead of a dangling clause.
    if (completion.finishReason === 'length') {
      console.warn('[chat] completion truncated at max_tokens — trimming to last full sentence');
      parsed.text = trimToLastSentence(parsed.text);
    }

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

    // Real booking action: the LLM only proposes structured booking data;
    // the backend validates availability and creates the reservation.
    if (checked.safe && parsed.bookingData && process.env.DATABASE_URL) {
      const b = parsed.bookingData;
      const required = ['guestName', 'phone', 'propertyId', 'roomType', 'checkIn', 'checkOut', 'guestsCount'];
      const complete = required.every((key) => b[key] !== null && b[key] !== undefined && b[key] !== '');

      if (complete) {
        try {
          const booking = await createBooking(b);
          const ticket = bookingTicketText(booking);
          response.booking = {
            reference: booking.booking_reference,
            status: booking.status,
            ticket,
          };
          response.reply = `${response.reply}\n\nBooking confirmed: **${booking.booking_reference}**.`;
        } catch (bookingErr) {
          const messages = {
            NO_AVAILABILITY: 'I’m sorry, that room is no longer available for those dates. Let me check another room option with you.',
            ROOM_TYPE_NOT_FOUND: 'I could not match that room type to our live booking inventory. Please choose one of the room types shown on the website.',
            ROOM_CAPACITY_EXCEEDED: 'That room cannot accommodate the number of guests requested. Let’s choose a larger room.',
          };
          response.booking_error = bookingErr.message;
          response.reply = messages[bookingErr.message] || 'I have the booking details, but I could not complete the reservation yet. Please check the details and try again.';
        }
      }
    }


    if (checked.safe && parsed.serviceRequestData && process.env.DATABASE_URL) {
      const r = parsed.serviceRequestData;
      const required = ['type', 'guestName', 'phone'];
      const complete = required.every((key) => r[key] !== null && r[key] !== undefined && r[key] !== '');
      if (complete) {
        try {
          const request = await createServiceRequest(r);
          response.service_request = {
            reference: request.reference,
            type: request.type,
            status: request.status,
          };
          const labels = { car_hire: 'car hire', conference: 'conference hall', tour: 'tour', extra_service: 'extra service' };
          response.reply = `${response.reply}\n\nYour ${labels[request.type] || 'service'} request has been received. Reference: **${request.reference}**. The hotel will review the details and provide any required quote or confirmation.`;
        } catch (requestErr) {
          response.service_request_error = requestErr.message;
          response.reply = 'I have the details, but I could not submit the service request yet. Please check the information and try again.';
        }
      }
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
