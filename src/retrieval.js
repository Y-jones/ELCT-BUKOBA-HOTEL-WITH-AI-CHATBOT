const fs = require('fs');
const path = require('path');

const KB_PATH = path.join(__dirname, '..', 'data', 'knowledge_base.json');
const KB = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));

/**
 * Lightweight, auditable retrieval for the ELCT Bukoba Hotel knowledge base.
 *
 * The knowledge base is small, so we use weighted keyword retrieval rather
 * than an external vector database.
 *
 * Supports:
 * - Exact keyword matching
 * - Singular/plural normalization
 * - Hotel-domain synonyms
 * - Intent detection
 * - Category boosting
 * - Broad service questions
 * - Booking + room retrieval
 * - Contact/location retrieval
 */

function buildChunks() {
  const chunks = [];

  // ============================================================
  // ORGANIZATION / ABOUT
  // ============================================================

  chunks.push({
    id: 'organization',
    category: 'about',
    text: `${KB.organization.description} ${KB.organization.mission_note} Core values: ${KB.organization.core_values
      .map(v => `${v.name} — ${v.description}`)
      .join(' ')} Amenities: ${KB.organization.amenities_general.join(', ')}.`,
    data: {
      organization: KB.organization,
    },
  });

  // ============================================================
  // SERVICES OVERVIEW
  // ============================================================

  chunks.push({
    id: 'services_overview',
    category: 'services',
    text: `
      ELCT Bukoba Hotel & Tours provides accommodation, restaurant and dining
      services, tours and tourism assistance, car hire, conference facilities,
      and additional guest services.

      The hotel offers different room types for guests, food and refreshments
      through its restaurant, tour arrangements to destinations in the area,
      vehicle hire services, conference facilities, and other services
      available to hotel guests.

      Main services include accommodation, restaurant and dining, tours,
      car hire, conference facilities, and additional guest services.
    `,
    data: {
      services: [
        'Accommodation',
        'Restaurant and dining',
        'Tours and tourism assistance',
        'Car hire',
        'Conference facilities',
        'Additional guest services',
      ],
    },
  });

  // ============================================================
  // LOCATION / CONTACT
  // ============================================================

  chunks.push({
    id: 'locations_contact',
    category: 'location',
    text: `Locations: ${KB.locations
      .map(
        l =>
          `${l.name} at ${l.address} (${l.latitude}, ${l.longitude})`
      )
      .join('; ')}. Contact: ${KB.contact.phones.join(
      ', '
    )}, WhatsApp ${KB.contact.whatsapp}, ${KB.contact.emails.join(', ')}.`,
    data: {
      locations: KB.locations,
      contact: KB.contact,
    },
  });

  // ============================================================
  // ROOMS
  // ============================================================

  chunks.push({
    id: 'rooms',
    category: 'rooms',
    text: `Room types: ${KB.rooms
      .map(
        r =>
          `${r.name} — $${r.price_foreigner_usd} foreigners / Tsh ${r.price_resident_tzs} residents per night, ${r.capacity_guests} guests, features: ${r.features.join(
            ', '
          )}`
      )
      .join('. ')}. ${KB.rooms_general_notes.join(' ')}`,
    data: {
      rooms: KB.rooms,
      rooms_general_notes: KB.rooms_general_notes,
    },
  });

  // ============================================================
  // RESTAURANT OVERVIEW
  // ============================================================

  chunks.push({
    id: 'restaurant_overview',
    category: 'restaurant',
    text: `${KB.restaurant.description} Serves ${KB.restaurant.serves.join(
      ', '
    )}, ${KB.restaurant.hours}. Other venues: ${KB.restaurant.other_venues
      .map(v => `${v.name} at ${v.location}`)
      .join('; ')}. ${KB.restaurant.menu_notes}`,
    data: {
      restaurant_overview: {
        description: KB.restaurant.description,
        serves: KB.restaurant.serves,
        hours: KB.restaurant.hours,
        other_venues: KB.restaurant.other_venues,
      },
    },
  });

  // ============================================================
  // RESTAURANT MENU
  // ============================================================

  const categories = [
    ...new Set(KB.restaurant.menu.map(m => m.menu_category)),
  ];

  for (const cat of categories) {
    const items = KB.restaurant.menu.filter(
      m => m.menu_category === cat
    );

    chunks.push({
      id: `menu_${cat.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      category: 'restaurant',
      text: `${cat} menu: ${items
        .map(
          i =>
            `${i.name} $${i.price_usd}${
              i.description ? ' (' + i.description + ')' : ''
            }`
        )
        .join('; ')}`,
      data: {
        menu_category: cat,
        items,
      },
    });
  }

  // ============================================================
  // CAR HIRE
  // ============================================================

  chunks.push({
    id: 'car_hire',
    category: 'car_hire',
    text: `Car hire: ${KB.car_hire.description} ${KB.car_hire.pricing_note}`,
    data: {
      car_hire: KB.car_hire,
    },
  });

  // ============================================================
  // CONFERENCE
  // ============================================================

  chunks.push({
    id: 'conference',
    category: 'conference',
    text: `Conference halls: ${KB.conference.description} ${KB.conference.pricing_note}`,
    data: {
      conference: KB.conference,
    },
  });

  // ============================================================
  // TOURS
  // ============================================================

  chunks.push({
    id: 'tour',
    category: 'tour',
    text: `Tours: ${KB.tour.description} Destinations: ${KB.tour.destinations_mentioned.join(
      ', '
    )}. ${KB.tour.pricing_note}`,
    data: {
      tour: KB.tour,
    },
  });

  // ============================================================
  // EXTRA SERVICES
  // ============================================================

  chunks.push({
    id: 'extra_services',
    category: 'extra_services',
    text: `Extra services: ${KB.extra_services
      .map(
        s =>
          `${s.name} — ${s.description}${
            s.pricing
              ? ' Pricing: ' +
                s.pricing
                  .map(p => `${p.item} $${p.price_usd}`)
                  .join(', ')
              : ''
          }`
      )
      .join('. ')}`,
    data: {
      extra_services: KB.extra_services,
    },
  });

  // ============================================================
  // BOOKING / POLICIES
  // ============================================================

  chunks.push({
    id: 'booking_policies',
    category: 'booking',
    text: `Booking: ${KB.booking_integration.assistant_behavior} Policies: ${KB.policies.pricing} ${KB.policies.payment} ${KB.policies.residency_pricing}`,
    data: {
      booking_integration: KB.booking_integration,
      policies: KB.policies,
    },
  });

  // ============================================================
  // DESTINATION
  // ============================================================

  chunks.push({
    id: 'destination',
    category: 'destination',
    text: `Destination knowledge: ${KB.destination_knowledge.region}. ${KB.destination_knowledge.note}`,
    data: {
      destination_knowledge: KB.destination_knowledge,
    },
  });

  return chunks;
}

const CHUNKS = buildChunks();

// ============================================================
// TOKENIZATION
// ============================================================

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// ============================================================
// STOPWORDS
// ============================================================

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'do',
  'does',
  'you',
  'your',
  'i',
  'we',
  'to',
  'for',
  'of',
  'in',
  'on',
  'at',
  'and',
  'or',
  'what',
  'how',
  'can',
  'could',
  'please',
  'me',
  'my',
  'have',
  'has',
  'want',
  'would',
  'like',
  'about',
  'tell',
  'it',
  'this',
  'that',
  'offer',
  'offers',
]);

// ============================================================
// TOKEN NORMALIZATION
// ============================================================

function normalizeToken(token) {
  if (token.endsWith('ies') && token.length > 4) {
    return token.slice(0, -3) + 'y';
  }

  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}

// ============================================================
// HOTEL-DOMAIN SYNONYMS
// ============================================================

const SYNONYMS = {
  room: [
    'room',
    'rooms',
    'accommodation',
    'accommodations',
    'suite',
    'suites',
    'stay',
    'staying',
    'bedroom',
    'bedrooms',
  ],

  restaurant: [
    'restaurant',
    'restaurants',
    'food',
    'dining',
    'meal',
    'meals',
    'eat',
    'eating',
    'lunch',
    'dinner',
    'breakfast',
    'menu',
  ],

  booking: [
    'booking',
    'book',
    'reserve',
    'reservation',
    'reservations',
    'availability',
    'available',
  ],

  contact: [
    'contact',
    'phone',
    'telephone',
    'whatsapp',
    'email',
    'address',
    'location',
    'directions',
  ],

  tour: [
    'tour',
    'tours',
    'tourism',
    'destination',
    'destinations',
    'sightseeing',
    'trip',
    'trips',
  ],

  car_hire: [
    'car',
    'cars',
    'vehicle',
    'vehicles',
    'hire',
    'rental',
    'rent',
  ],

  conference: [
    'conference',
    'meeting',
    'meetings',
    'hall',
    'halls',
    'event',
    'events',
  ],

  extra_services: [
    'service',
    'services',
    'laundry',
    'airport',
    'transfer',
    'transfers',
  ],

  services: [
    'service',
    'services',
    'offer',
    'offers',
    'provide',
    'provides',
    'facility',
    'facilities',
    'amenity',
    'amenities',
  ],
};

// ============================================================
// QUERY EXPANSION
// ============================================================

function expandQueryTokens(tokens) {
  const expanded = new Set();

  for (const token of tokens) {
    const normalized = normalizeToken(token);

    expanded.add(token);
    expanded.add(normalized);

    for (const [group, words] of Object.entries(SYNONYMS)) {
      if (
        words.includes(token) ||
        words.includes(normalized)
      ) {
        expanded.add(group);
      }
    }
  }

  return [...expanded];
}

// ============================================================
// BROAD SERVICE QUESTION DETECTION
// ============================================================

function isBroadServiceQuestion(query) {
  const q = query.toLowerCase().trim();

  const patterns = [
    'what do you do',
    'what does the hotel do',
    'what services do you offer',
    'what services do you provide',
    'what do you offer',
    'what can you offer',
    'what can i do at the hotel',
    'tell me about your services',
    'what facilities do you have',
    'what services are available',
    'what can the hotel do',
    'what does the hotel offer',
  ];

  return patterns.some(pattern => q.includes(pattern));
}

// ============================================================
// INTENT DETECTION
// ============================================================

function detectIntent(query) {
  // Broad service questions are checked first.
  if (isBroadServiceQuestion(query)) {
    return 'services_overview';
  }

  const tokens = tokenize(query);
  const normalized = tokens.map(normalizeToken);

  const has = (...words) =>
    words.some(
      word =>
        tokens.includes(word) ||
        normalized.includes(normalizeToken(word))
    );

  // ------------------------------------------------------------
  // ROOMS
  // ------------------------------------------------------------

  if (
    has(
      'room',
      'rooms',
      'accommodation',
      'accommodations',
      'suite',
      'suites',
      'bedroom',
      'bedrooms'
    )
  ) {
    return 'rooms';
  }

  // ------------------------------------------------------------
  // RESTAURANT
  // ------------------------------------------------------------

  if (
    has(
      'restaurant',
      'restaurants',
      'food',
      'dining',
      'menu',
      'meal',
      'meals',
      'lunch',
      'dinner',
      'breakfast'
    )
  ) {
    return 'restaurant';
  }

  // ------------------------------------------------------------
  // BOOKING
  // ------------------------------------------------------------

  if (
    has(
      'booking',
      'book',
      'reservation',
      'reservations',
      'reserve',
      'availability',
      'available'
    )
  ) {
    return 'booking';
  }

  // ------------------------------------------------------------
  // CONTACT / LOCATION
  // ------------------------------------------------------------

  if (
    has(
      'contact',
      'phone',
      'telephone',
      'whatsapp',
      'email',
      'address',
      'location',
      'directions'
    )
  ) {
    return 'location_contact';
  }

  // ------------------------------------------------------------
  // TOURS
  // ------------------------------------------------------------

  if (
    has(
      'tour',
      'tours',
      'tourism',
      'destination',
      'destinations',
      'trip',
      'trips',
      'sightseeing'
    )
  ) {
    return 'tour';
  }

  // ------------------------------------------------------------
  // CAR HIRE
  // ------------------------------------------------------------

  if (
    has(
      'car',
      'cars',
      'vehicle',
      'vehicles',
      'hire',
      'rental',
      'rent'
    )
  ) {
    return 'car_hire';
  }

  // ------------------------------------------------------------
  // CONFERENCE
  // ------------------------------------------------------------

  if (
    has(
      'conference',
      'meeting',
      'meetings',
      'hall',
      'halls',
      'event',
      'events'
    )
  ) {
    return 'conference';
  }

  // ------------------------------------------------------------
  // EXTRA SERVICES
  // ------------------------------------------------------------

  if (
    has(
      'service',
      'services',
      'laundry',
      'transfer',
      'transfers'
    )
  ) {
    return 'extra_services';
  }

  return null;
}

// ============================================================
// CHUNK SCORING
// ============================================================

function scoreChunk(query, chunk) {
  const queryTokens = tokenize(query).filter(
    t => !STOPWORDS.has(t)
  );

  const expandedTokens = expandQueryTokens(queryTokens);

  const chunkTokens = tokenize(
    `${chunk.id} ${chunk.category} ${chunk.text}`
  );

  const chunkSet = new Set(chunkTokens);

  const normalizedChunkSet = new Set(
    chunkTokens.map(normalizeToken)
  );

  let score = 0;

  // ------------------------------------------------------------
  // 1. Exact keyword matching
  // ------------------------------------------------------------

  for (const token of queryTokens) {
    if (chunkSet.has(token)) {
      score += 2;
    }

    if (
      normalizedChunkSet.has(
        normalizeToken(token)
      )
    ) {
      score += 1;
    }
  }

  // ------------------------------------------------------------
  // 2. Synonym / category matching
  // ------------------------------------------------------------

  for (const token of expandedTokens) {
    if (chunk.id === token) {
      score += 5;
    }

    if (chunk.category === token) {
      score += 5;
    }
  }

  // ------------------------------------------------------------
  // 3. Intent-based boosting
  // ------------------------------------------------------------

  const intent = detectIntent(query);

  if (intent) {
    if (chunk.id === intent) {
      score += 10;
    }

    if (chunk.category === intent) {
      score += 8;
    }

    // Broad service questions.
    if (
      intent === 'services_overview' &&
      chunk.id === 'services_overview'
    ) {
      score += 15;
    }

    // Organization provides useful background for service questions.
    if (
      intent === 'services_overview' &&
      chunk.id === 'organization'
    ) {
      score += 3;
    }

    // Contact questions should strongly prefer contact/location.
    if (
      intent === 'location_contact' &&
      chunk.id === 'locations_contact'
    ) {
      score += 10;
    }

    // Booking questions benefit from room information.
    if (
      intent === 'booking' &&
      chunk.id === 'rooms'
    ) {
      score += 4;
    }
  }

  return score;
}

// ============================================================
// RETRIEVE CONTEXT
// ============================================================

function retrieveContext(query, { topK = 4 } = {}) {
  const scored = CHUNKS
    .map(chunk => ({
      chunk,
      score: scoreChunk(query, chunk),
    }))
    .sort((a, b) => b.score - a.score);

  let top = scored
    .filter(item => item.score > 0)
    .slice(0, topK)
    .map(item => item.chunk);

  // ------------------------------------------------------------
  // Fallback when nothing matches
  // ------------------------------------------------------------

  if (top.length === 0) {
    top = CHUNKS.filter(chunk =>
      [
        'organization',
        'locations_contact',
      ].includes(chunk.id)
    );
  }

  // ------------------------------------------------------------
  // Debug logging
  // ------------------------------------------------------------

  console.log(
    '[retrieval]',
    query,
    '=>',
    scored
      .slice(0, 6)
      .map(
        x =>
          `${x.chunk.id}:${x.score}`
      )
      .join(', ')
  );

  return top;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  KB,
  CHUNKS,
  retrieveContext,
  tokenize,
};