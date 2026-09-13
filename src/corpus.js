const fs = require('fs');
const path = require('path');

const KB_PATH = path.join(__dirname, '..', 'data', 'knowledge_base.json');
const ATTRACTIONS_PATH = path.join(__dirname, '..', 'data', 'attractions.json');

const KB = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
const ATTRACTIONS = fs.existsSync(ATTRACTIONS_PATH)
  ? JSON.parse(fs.readFileSync(ATTRACTIONS_PATH, 'utf-8'))
  : {};

/**
 * Generic, schema-agnostic knowledge ingestion.
 *
 * Nothing in this file knows what a "room" or a "conference hall" or an
 * "attraction" is. It just walks whatever shape data/knowledge_base.json
 * and data/attractions.json happen to have and turns every object into
 * readable text automatically:
 *
 *  - an array of records (rooms, menu items, attractions, extra services)
 *    becomes one chunk per record
 *  - a flat object (all scalar fields) becomes one chunk
 *  - a mixed object recurses into its nested parts, keeping its own
 *    scalar fields as a short "intro" chunk
 *
 * The practical effect: add a new field to the hotel's data (a security
 * policy, a new tour, a new attraction, a whole new top-level section) and
 * it is automatically retrievable and automatically shows up in the
 * always-on directory below — no code in this file, retrieval.js, or
 * systemPrompt.js needs to change. The only thing that ever needs
 * updating by hand is the *content* (facts about the hotel/region), never
 * the retrieval logic.
 */

function titleCase(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function humanizeValue(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Array.isArray(v)) return v.map(humanizeValue).filter(Boolean).join(', ');
  if (isPlainObject(v)) {
    return Object.entries(v)
      .map(([k, val]) => {
        const h = humanizeValue(val);
        return h ? `${titleCase(k)}: ${h}` : '';
      })
      .filter(Boolean)
      .join('. ');
  }
  return String(v);
}

// One JSON object (a room, a menu item, an attraction, a policy group) ->
// one natural-language sentence, generically, from whatever keys it has.
function objectToSentence(obj, fallbackName) {
  const name = obj.name || obj.title || fallbackName;
  const rest = Object.entries(obj)
    .filter(([k]) => !['name', 'title'].includes(k))
    .map(([k, v]) => {
      const h = humanizeValue(v);
      return h ? `${titleCase(k)}: ${h}` : '';
    })
    .filter(Boolean)
    .join('. ');
  return name ? `${name} — ${rest}` : rest;
}

let counter = 0;
function nextId(prefix) {
  counter += 1;
  return `${prefix}_${counter}`;
}

function walk(node, keyPath) {
  const chunks = [];
  const section = keyPath[0];
  const label = keyPath[keyPath.length - 1];

  if (Array.isArray(node)) {
    if (node.length === 0) return chunks;

    if (isPlainObject(node[0])) {
      // Array of records: one chunk per record.
      node.forEach((item, i) => {
        if (!isPlainObject(item)) return;
        chunks.push({
          id: nextId(keyPath.join('_')),
          section,
          path: [...keyPath, i].join('.'),
          text: `[${titleCase(label)}] ${objectToSentence(item, `${titleCase(label)} ${i + 1}`)}`,
        });
      });
    } else {
      // Array of scalars: one chunk for the whole list.
      chunks.push({
        id: nextId(keyPath.join('_')),
        section,
        path: keyPath.join('.'),
        text: `${titleCase(label)}: ${node.join(', ')}`,
      });
    }
    return chunks;
  }

  if (isPlainObject(node)) {
    const entries = Object.entries(node);
    const nestedEntries = entries.filter(([, v]) => Array.isArray(v) || isPlainObject(v));
    const scalarEntries = entries.filter(([, v]) => !Array.isArray(v) && !isPlainObject(v));

    if (nestedEntries.length === 0) {
      // Flat object: one chunk.
      const text = scalarEntries
        .map(([k, v]) => (v || v === 0 ? `${titleCase(k)}: ${v}` : ''))
        .filter(Boolean)
        .join('. ');
      if (text) {
        chunks.push({
          id: nextId(keyPath.join('_')),
          section,
          path: keyPath.join('.'),
          text: `[${titleCase(label)}] ${text}`,
        });
      }
      return chunks;
    }

    // Mixed object: keep its own scalar fields as an intro chunk, then
    // recurse into every nested part.
    if (scalarEntries.length) {
      const text = scalarEntries
        .map(([k, v]) => (v || v === 0 ? `${titleCase(k)}: ${v}` : ''))
        .filter(Boolean)
        .join('. ');
      if (text) {
        chunks.push({
          id: nextId(keyPath.join('_') + '_intro'),
          section,
          path: keyPath.join('.'),
          text: `[${titleCase(label)}] ${text}`,
        });
      }
    }
    for (const [k, v] of nestedEntries) {
      chunks.push(...walk(v, [...keyPath, k]));
    }
    return chunks;
  }

  return chunks;
}

function buildCorpus() {
  counter = 0;
  const chunks = [];
  for (const [key, value] of Object.entries(KB)) {
    if (key.startsWith('_')) continue;
    chunks.push(...walk(value, [key]));
  }
  for (const [key, value] of Object.entries(ATTRACTIONS)) {
    if (key.startsWith('_')) continue;
    chunks.push(...walk(value, [key]));
  }
  return chunks;
}

// One short line per top-level section of the hotel/attractions data,
// generated automatically from whatever that section actually contains.
// This is always included in context (it's small) so the model always
// knows the full shape of what the hotel and the area offer, even for a
// query worded in a way the detail-chunk search doesn't score well on
// (e.g. a Swahili phrase, or a topic combination nobody anticipated) —
// it can say "we do offer X broadly, let me get you the exact detail"
// instead of "there is no information".
function buildDirectory() {
  const lines = [];
  const sources = [
    ...Object.entries(KB).filter(([k]) => !k.startsWith('_')),
    ...Object.entries(ATTRACTIONS).filter(([k]) => !k.startsWith('_')),
  ];

  for (const [key, value] of sources) {
    let summary;
    if (Array.isArray(value)) {
      const names = value
        .slice(0, 8)
        .map((v) => (isPlainObject(v) ? v.name || v.title : v))
        .filter(Boolean);
      summary = `${value.length} item(s) — ${names.join(', ')}`;
    } else if (isPlainObject(value) && typeof value.description === 'string') {
      summary = value.description.split('. ')[0];
    } else if (isPlainObject(value)) {
      summary = Object.keys(value).map(titleCase).join(', ');
    } else {
      summary = String(value);
    }
    lines.push(`- ${titleCase(key)}: ${summary}`);
  }
  return lines.join('\n');
}

module.exports = { KB, ATTRACTIONS, buildCorpus, buildDirectory };
