const fs = require('fs');
const path = require('path');
const { query, withTransaction } = require('./db');
const { KB } = require('./retrieval');

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn('[db] DATABASE_URL not set — database features disabled');
    return false;
  }

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await query(schema);

  await withTransaction(async (client) => {
    for (const property of KB.locations) {
      await client.query(
        `INSERT INTO properties (id, name, city, address, latitude, longitude)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city,
           address=EXCLUDED.address, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude`,
        [property.id, property.name, property.city, property.address, property.latitude, property.longitude]
      );
    }

    const mainPropertyId = KB.locations[0].id;
    for (const room of KB.rooms) {
      const result = await client.query(
        `INSERT INTO room_types (property_id, name, capacity_guests, beds, price_foreigner_usd, price_resident_tzs)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (property_id, name) DO UPDATE SET capacity_guests=EXCLUDED.capacity_guests,
           beds=EXCLUDED.beds, price_foreigner_usd=EXCLUDED.price_foreigner_usd,
           price_resident_tzs=EXCLUDED.price_resident_tzs
         RETURNING id`,
        [mainPropertyId, room.name, room.capacity_guests, room.beds, room.price_foreigner_usd, room.price_resident_tzs]
      );
      await client.query(
        `INSERT INTO room_inventory (room_type_id, total_units)
         VALUES ($1, 0)
         ON CONFLICT (room_type_id) DO NOTHING`,
        [result.rows[0].id]
      );
    }
  });

  console.log('[db] schema and hotel reference data ready');
  return true;
}

module.exports = { initializeDatabase };
