/*
 * ELCT Bukoba Hotel & Tours — AI Assistant widget
 *
 * Set BACKEND_URL below to your deployed backend (see /backend in this
 * project) to get real Groq + RAG answers. Until then — or if the backend
 * is unreachable for any reason — this file automatically falls back to a
 * small local rule-based matcher reading knowledge.js, so the widget always
 * has *something* correct to say rather than breaking. The UI/DOM code is
 * identical either way; only where the reply text comes from changes.
 */
(function () {
  'use strict';

  // Point this at your deployed backend, e.g. 'https://api.elctbukobahotelandtours.com'
  // Leave as '' to always use the local demo matcher (no backend yet).
  var BACKEND_URL = 'https://elct-bukoba-hotel-with-ai-chatbot.onrender.com';
  var BACKEND_TIMEOUT_MS = 8000;

  var state = {
    open: false,
    lang: 'en',
    history: [] // {role: 'user'|'bot', text}
  };

  var STR = {
    en: {
      title: 'ELCT BUKOBA HOTEL AI ASSISTANT',
      status: 'Usually replies instantly',
      placeholder: 'Ask about rooms, dining, tours…',
      greeting: "Hello! I'm the ELCT Bukoba Hotel AI Assistant. I can help with rooms, dining, conference halls, tours, car hire, and getting here. What would you like to know?",
      quick: ['Rooms', 'Restaurant', 'Conference Facilities', 'Book a Room', 'Hotel Location', 'Get Directions', 'Contact Hotel'],
      humanChip: 'Talk to a human',
      humanText: "Hi, I'd like to speak with someone at the hotel.",
      protoNote: "(Prototype note: answers here are matched from the hotel's own published details — the full AI assistant connects once the backend is built.)"
    },
    sw: {
      title: 'ELCT BUKOBA HOTEL AI ASSISTANT',
      status: 'Hujibu papo hapo kwa kawaida',
      placeholder: 'Uliza kuhusu vyumba, chakula, safari…',
      greeting: 'Karibu! Mimi ni ELCT Bukoba Hotel AI Assistant. Ninaweza kukusaidia kuhusu vyumba, chakula, kumbi za mikutano, safari, kukodi gari, na jinsi ya kufika hapa. Unahitaji msaada gani?',
      quick: ['Vyumba', 'Mkahawa', 'Kumbi za Mikutano', 'Weka Chumba', 'Mahali Lilipo Hoteli', 'Njia ya Kufika', 'Wasiliana Nasi'],
      humanChip: 'Ongea na mtu',
      humanText: 'Habari, ningependa kuzungumza na mtu hotelini.',
      protoNote: '(Kumbuka: mfano huu — majibu yametolewa kutoka taarifa za hoteli zilizochapishwa; msaidizi kamili wa AI utaunganishwa mfumo wa nyuma ukishakamilika.)'
    },
    fr: {
      title: 'ELCT BUKOBA HOTEL AI ASSISTANT',
      status: 'Réponse généralement instantanée',
      placeholder: 'Posez une question sur les chambres, le restaurant…',
      greeting: "Bonjour ! Je suis ELCT Bukoba Hotel AI Assistant. Je peux vous renseigner sur les chambres, le restaurant, les salles de conférence, les excursions, la location de voiture, et comment nous rejoindre. Que souhaitez-vous savoir ?",
      quick: ['Chambres', 'Restaurant', 'Salles de conférence', 'Réserver une chambre', 'Emplacement', 'Itinéraire', 'Contact'],
      humanChip: 'Parler à quelqu\'un',
      humanText: "Bonjour, j'aimerais parler à quelqu'un de l'hôtel.",
      protoNote: "(Remarque prototype : ces réponses proviennent des informations publiées par l'hôtel — l'assistant complet se connectera une fois le backend construit.)"
    },
    de: {
      title: 'ELCT BUKOBA HOTEL AI ASSISTANT',
      status: 'Antwortet meist sofort',
      placeholder: 'Fragen Sie nach Zimmern, Restaurant, Touren…',
      greeting: 'Hallo! Ich bin der ELCT Bukoba Hotel AI Assistant. Ich helfe gerne bei Zimmern, Restaurant, Konferenzräumen, Touren, Autovermietung und der Anreise. Womit kann ich helfen?',
      quick: ['Zimmer', 'Restaurant', 'Konferenzräume', 'Zimmer buchen', 'Standort', 'Wegbeschreibung', 'Kontakt'],
      humanChip: 'Mit Mensch sprechen',
      humanText: 'Hallo, ich möchte gerne mit jemandem vom Hotel sprechen.',
      protoNote: '(Prototyp-Hinweis: Diese Antworten stammen aus den veröffentlichten Hoteldaten — der vollständige KI-Assistent wird angebunden, sobald das Backend fertig ist.)'
    }
  };

  function fmtUSD(n) { return '$' + n; }
  function fmtTZS(n) { return 'Tsh ' + n.toLocaleString('en-US') + '/='; }

  // ---------- Response builders (pull only from KB — never invent) ----------

  function respondRooms() {
    var lines = KB.rooms.map(function (r) {
      return '<li><strong>' + r.name + '</strong> — ' + fmtUSD(r.price_foreigner_usd) + ' (foreigners) / ' + fmtTZS(r.price_resident_tzs) + ' (residents), ' + r.capacity_guests + ' guest' + (r.capacity_guests > 1 ? 's' : '') + '</li>';
    }).join('');
    return '<p>Here are our room types:</p><ul>' + lines + '</ul><p>All rooms include a private bathroom with shower, cable TV, and free WiFi. Prices shown are as published — final pricing and availability are always confirmed through our booking system.</p>';
  }

  function respondRestaurant(query) {
    var q = query.toLowerCase();
    // If they named a specific dish, try to find it
    var hit = KB.restaurant.menu.find(function (m) { return q.indexOf(m.name.toLowerCase()) !== -1; });
    if (hit) {
      return '<p><strong>' + hit.name + '</strong> (' + hit.menu_category + ') — ' + fmtUSD(hit.price_usd) + (hit.description ? '<br>' + hit.description : '') + '</p>';
    }
    var cats = [...new Set(KB.restaurant.menu.map(function (m) { return m.menu_category; }))];
    return '<p>' + KB.restaurant.description + '</p><p>We serve ' + KB.restaurant.serves.join(', ') + ', ' + KB.restaurant.hours.toLowerCase() + '. Our menu is organized into: ' + cats.join(', ') + '.</p><p>Ask me about a specific dish or category and I\'ll pull the price.</p>';
  }

  // Note: KB.*.pricing_note fields are written as instructions for an LLM
  // (e.g. "do not invent a rate") — correct for the Groq backend's system
  // prompt, but wrong to show verbatim to a guest. This local demo matcher
  // has no LLM to rephrase them, so it uses its own guest-facing copy here
  // instead of interpolating pricing_note directly.
  function respondCarHire() {
    return '<p>' + KB.car_hire.description + '</p><p>Pricing isn\'t published for car hire — send over your trip details and I\'ll have the hotel get back to you with a quote.</p>';
  }

  function respondConference() {
    var c = KB.conference;
    return '<p>We have ' + c.hall_count + ' conference halls, accommodating ' + c.capacity_range_guests + ' guests depending on the group. Facilities include ' + c.services.join(', ').toLowerCase() + '.</p><p>Hall pricing depends on your event size and dates — let us know what you\'re planning and the hotel will follow up with a quote.</p>';
  }

  function respondTour() {
    return '<p>' + KB.tour.description + '</p><p>Popular destinations include: ' + KB.tour.destinations_mentioned.join(', ') + '.</p><p>Tour pricing isn\'t published — tell me which destination interests you and I\'ll pass it along for a quote.</p>';
  }

  function respondExtraServices(query) {
    var q = query.toLowerCase();
    var hit = KB.extra_services.find(function (s) { return q.indexOf(s.name.toLowerCase().split(' ')[0]) !== -1; });
    if (hit) {
      var priceLines = (hit.pricing || []).map(function (p) { return p.item + ': ' + fmtUSD(p.price_usd); }).join('<br>');
      return '<p><strong>' + hit.name + '</strong><br>' + hit.description + (priceLines ? '<br>' + priceLines : '') + '</p>';
    }
    var names = KB.extra_services.map(function (s) { return s.name; }).join(', ');
    return '<p>Our extra services include: ' + names + '. Ask me about any of these for details and pricing.</p>';
  }

  function respondContact() {
    var c = KB.contact;
    return '<p>You can reach us at:<br>' + c.phones.slice(0, 2).join(' / ') + '<br>WhatsApp: ' + c.whatsapp + '<br>' + c.emails.join(' / ') + '</p><p>' + c.address + '</p>';
  }

  function respondLocation() {
    var main = KB.locations[0];
    var others = KB.locations.slice(1).map(function (l) { return l.name; }).join(' and ');
    return '<p>Our main property is at ' + main.address + ', on the shore of Lake Victoria. We also have properties at ' + others + '.</p><p>In the full version, "Get Directions" calls a real routing service to give you distance and travel time from wherever you\'re coming from — in this prototype that lookup isn\'t wired up yet.</p>';
  }

  function respondBooking() {
    return '<p>I can take down what you\'re looking for — dates, room type, number of guests, and which property (Bukoba Main, Annex, or Chato) — and pass it along. Final availability and confirmation happen through our booking system or by speaking with our front desk, since I don\'t book rooms directly myself.</p><p>What dates and room type did you have in mind?</p>';
  }

  // Competitor deflection — triggers on "other hotel/restaurant" style phrasing
  var COMPETITOR_PATTERNS = [
    /best (hotel|restaurant|lodge|guesthouse)s? in/i,
    /other hotels?/i,
    /another hotel/i,
    /recommend .*(hotel|restaurant|lodge)/i,
    /somewhere else to (eat|stay)/i,
    /better than (elct|this hotel|you)/i,
    /alternative (hotel|restaurant)/i
  ];
  function isCompetitorRequest(q) {
    return COMPETITOR_PATTERNS.some(function (re) { return re.test(q); });
  }

  function respondCompetitor() {
    return '<p>ELCT Bukoba Hotel & Tours has its own restaurant, cafés, and accommodation right here — I\'d recommend our dining and rooms rather than pointing you elsewhere. Happy to walk you through our menu or room options.</p>';
  }

  function respondAbout() {
    var org = KB.organization;
    return '<p>' + org.description + '</p><p>' + org.mission_note + '</p>';
  }

  function respondGreeting() {
    return STR[state.lang].greeting;
  }

  function respondFallback() {
    return '<p>I don\'t have that in what I\'ve been given yet — for anything I\'m not sure of, it\'s best to confirm directly with the hotel:<br>' + KB.contact.phones[0] + ' · ' + KB.contact.emails[0] + '</p>';
  }

  // ---------- Intent matching ----------
  function route(query) {
    var q = query.toLowerCase();
    if (isCompetitorRequest(q)) return respondCompetitor();
    if (/^(hi|hello|hey|habari|jambo|salut|bonjour|hallo|karibu)\b/.test(q)) return respondGreeting();
    if (/book|reserve|reservation|availability/.test(q)) return respondBooking();
    if (/room|suite|suit|twin|double|deluxe|cost|price|rate|how much|charges?\b/.test(q)) return respondRooms();
    if (/wifi|wi-fi|internet/.test(q)) return respondRooms();
    if (/menu|pizza|soup|beef|pork|chicken|fish|burger|sandwich|breakfast|lunch|dinner|restaurant|food|eat|dish/.test(q)) return respondRestaurant(query);
    if (/car hire|rent a car|hire a car|driver/.test(q)) return respondCarHire();
    if (/conference|hall|meeting|event space|wedding venue/.test(q)) return respondConference();
    if (/tour|safari|excursion|wildlife|national park|waterfall/.test(q)) return respondTour();
    if (/laundry|photo|curio|souvenir|money transfer|stationery|airport pickup|pickup/.test(q)) return respondExtraServices(query);
    if (/contact|phone|email|whatsapp|call you/.test(q)) return respondContact();
    if (/where|location|address|direction|get to|how far|reach the hotel/.test(q)) return respondLocation();
    if (/about|tell me about|who are you|what is elct|what kind of hotel|hotel itself|history|values/.test(q)) return respondAbout();
    return respondFallback();
  }

  // ---------- Rendering ----------
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
  }

  function addMessage(role, html) {
    var messages = document.getElementById('cw-messages');
    var wrap = el('div', 'cw-msg ' + role);
    var bubble = el('div', 'cw-bubble', html);
    wrap.appendChild(bubble);
    messages.appendChild(wrap);
    scrollToBottom(messages);
    return bubble;
  }

  // Appends a "Send via WhatsApp" button inside a bot message bubble —
  // used when the assistant has enough booking info to hand off. Opens in
  // a new tab; the message text and phone number are both backend-built
  // from the real hotel number, never from free-form model output.
  function appendWhatsAppButton(bubble, url, label) {
    var wrap = el('div');
    wrap.style.marginTop = '8px';
    var btn = el('a', null, label || 'Send via WhatsApp');
    btn.href = url;
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:#2E5E38;color:#fff;padding:8px 14px;border-radius:16px;font-size:13px;font-weight:600;text-decoration:none;';
    wrap.appendChild(btn);
    bubble.appendChild(wrap);
  }

  // Appends contextual follow-up chips inside a bot message bubble —
  // tapping one sends it as the next message, same as the top quick-action bar.
  function appendSuggestionChips(bubble, suggestions) {
    if (!suggestions || !suggestions.length) return;
    var wrap = el('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;';
    suggestions.forEach(function (s) {
      var chip = el('button', null, s);
      chip.style.cssText = 'border:1px solid #E9DCC8;background:#FBF3E7;color:#3A2A1A;font-size:12px;padding:5px 10px;border-radius:14px;cursor:pointer;font-family:inherit;';
      chip.addEventListener('click', function () { sendUserMessage(s); });
      wrap.appendChild(chip);
    });
    bubble.appendChild(wrap);
  }

  function showTyping() {
    var messages = document.getElementById('cw-messages');
    var wrap = el('div', 'cw-msg bot');
    wrap.id = 'cw-typing-indicator';
    var bubble = el('div', 'cw-bubble');
    var t = el('div', 'cw-typing', '<span></span><span></span><span></span>');
    bubble.appendChild(t);
    wrap.appendChild(bubble);
    messages.appendChild(wrap);
    scrollToBottom(messages);
  }

  function hideTyping() {
    var t = document.getElementById('cw-typing-indicator');
    if (t) t.remove();
  }

  // Calls the real backend. Returns the parsed JSON body on success, or null
  // on any failure (network error, timeout, non-2xx, malformed body) — null
  // is the signal to fall back to the local demo matcher.
  function fetchBackendReply(text) {
    if (!BACKEND_URL) return Promise.resolve(null);
    var controller = ('AbortController' in window) ? new AbortController() : null;
    var timeoutId = controller ? setTimeout(function () { controller.abort(); }, BACKEND_TIMEOUT_MS) : null;

    return fetch(BACKEND_URL.replace(/\/$/, '') + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: state.history.slice(-8)
      }),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data.reply !== 'string') return null;
        return data;
      })
      .catch(function () {
        if (timeoutId) clearTimeout(timeoutId);
        return null;
      });
  }

  // Plain-text replies (from the backend) get escaped + linebreak-converted;
  // the local demo matcher already returns deliberate HTML (lists, bold) so
  // it passes straight through.
  function renderPlainTextReply(text) {
    return '<p>' + escapeHtml(text).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
  }

  function sendUserMessage(text) {
    if (!text.trim()) return;
    addMessage('user', escapeHtml(text));
    state.history.push({ role: 'user', text: text });
    document.getElementById('cw-input').value = '';
    showTyping();

    var minDelay = new Promise(function (resolve) {
      setTimeout(resolve, 400 + Math.min(500, text.length * 8));
    });

    Promise.all([fetchBackendReply(text), minDelay]).then(function (results) {
      var data = results[0];
      hideTyping();
      if (data) {
        var bubble = addMessage('bot', renderPlainTextReply(data.reply));
        state.history.push({ role: 'bot', text: data.reply });
        if (data.lang && data.lang !== state.lang) setLang(data.lang);
        if (data.whatsapp_url) {
          var label = { en: 'Send via WhatsApp', sw: 'Tuma kwa WhatsApp', fr: 'Envoyer via WhatsApp', de: 'Über WhatsApp senden' }[data.lang] || 'Send via WhatsApp';
          appendWhatsAppButton(bubble, data.whatsapp_url, label);
        }
        if (data.suggestions) appendSuggestionChips(bubble, data.suggestions);
      } else {
        var localHtml = route(text);
        var localBubble = addMessage('bot', localHtml);
        state.history.push({ role: 'bot', text: localHtml.replace(/<[^>]+>/g, ' ').trim() });
        void localBubble;
      }
    });
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.innerText = s;
    return d.innerHTML;
  }

  // Called automatically once the backend tells us what language the guest
  // is actually writing in (see data.lang handling below) — no visible
  // toggle for the guest to manage themselves.
  function setLang(lang) {
    state.lang = lang;
    document.getElementById('cw-title').textContent = STR[lang].title;
    document.getElementById('cw-status').textContent = STR[lang].status;
    document.getElementById('cw-input').placeholder = STR[lang].placeholder;
  }

  function togglePanel(force) {
    var panel = document.getElementById('concierge-panel');
    var launcher = document.getElementById('concierge-launcher');
    state.open = typeof force === 'boolean' ? force : !state.open;
    panel.classList.toggle('cw-open', state.open);
    if (state.open && launcher) launcher.classList.remove('cw-pulse');
    if (state.open && state.history.length === 0) {
      addMessage('bot', STR[state.lang].greeting + '<p style="margin-top:10px;font-size:11px;color:#8A7B6A;">' + STR[state.lang].protoNote + '</p>');
      state.history.push({ role: 'bot' });
    }
    if (state.open) document.getElementById('cw-input').focus();
  }

  function buildWidgetDom() {
    var launcher = el('button', null);
    launcher.id = 'concierge-launcher';
    launcher.setAttribute('aria-label', 'Open ELCT Bukoba Hotel AI Assistant chat');
    launcher.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><span class="cw-dot"></span>';
    document.body.appendChild(launcher);

    var panel = el('div');
    panel.id = 'concierge-panel';
    panel.innerHTML =
      '<div class="cw-header">' +
        '<div class="cw-who">' +
          '<div class="cw-avatar">AI</div>' +
          '<div><div class="cw-name" id="cw-title">ELCT BUKOBA HOTEL AI ASSISTANT</div><div class="cw-status" id="cw-status">Usually replies instantly</div></div>' +
        '</div>' +
        '<button class="cw-close" id="cw-close" aria-label="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '</div>' +
      '<div class="cw-messages" id="cw-messages"></div>' +
      '<div class="cw-inputrow">' +
        '<input id="cw-input" type="text" placeholder="Ask about rooms, dining, tours…" autocomplete="off">' +
        '<button class="cw-send" id="cw-send" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button>' +
      '</div>';
    document.body.appendChild(panel);

    launcher.addEventListener('click', function () { togglePanel(); });
    document.getElementById('cw-close').addEventListener('click', function () { togglePanel(false); });
    document.getElementById('cw-send').addEventListener('click', function () {
      sendUserMessage(document.getElementById('cw-input').value);
    });
    document.getElementById('cw-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendUserMessage(this.value);
    });
  }

  // Allow any page element to open the widget with a preset message,
  // e.g. a "Book a Room" nav button: <a href="#" data-open-concierge="Book a Room">
  function wireOpenTriggers() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-open-concierge]'), function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        togglePanel(true);
        var preset = trigger.getAttribute('data-open-concierge');
        if (preset) setTimeout(function () { sendUserMessage(preset); }, 300);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildWidgetDom();
    wireOpenTriggers();

    // A quiet, one-time attention cue — pulses a few times a couple of
    // seconds after page load, then stops for good (or never starts if the
    // guest has already opened the chat, or prefers reduced motion).
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      setTimeout(function () {
        if (state.open) return;
        var launcher = document.getElementById('concierge-launcher');
        if (launcher) launcher.classList.add('cw-pulse');
      }, 2500);
    }
  });
})();
