const { query, withTransaction } = require('./db');

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '').replace(/^00/, '+');
}

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function nightsBetween(checkIn, checkOut) {
  const a = new Date(`${checkIn}T00:00:00Z`);
  const b = new Date(`${checkOut}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

async function findRoomType({ propertyId, roomType }) {
  const result = await query(
    `SELECT rt.*, p.name AS property_name
     FROM room_types rt JOIN properties p ON p.id=rt.property_id
     WHERE rt.property_id=$1 AND rt.active=true AND LOWER(rt.name)=LOWER($2)
     LIMIT 1`,
    [propertyId, roomType]
  );
  return result.rows[0] || null;
}

async function availability({ propertyId, roomType, checkIn, checkOut, guestsCount = 1 }) {
  const start = normalizeDate(checkIn);
  const end = normalizeDate(checkOut);
  if (!start || !end || nightsBetween(start, end) <= 0) throw new Error('Invalid check-in/check-out dates');

  const sql = `
    SELECT rt.id, rt.name, rt.capacity_guests, rt.price_foreigner_usd, rt.price_resident_tzs,
           COALESCE(ri.total_units,0) AS total_units,
           COALESCE(SUM(CASE WHEN b.status IN ('pending','confirmed','checked_in') THEN 1 ELSE 0 END),0) AS reserved_units
    FROM room_types rt
    LEFT JOIN room_inventory ri ON ri.room_type_id=rt.id
    LEFT JOIN bookings b ON b.room_type_id=rt.id
      AND b.property_id=rt.property_id
      AND b.check_in < $3::date
      AND b.check_out > $2::date
      AND b.status IN ('pending','confirmed','checked_in')
    WHERE rt.property_id=$1 AND rt.active=true
      AND rt.capacity_guests >= $4
      AND ($5::text IS NULL OR LOWER(rt.name)=LOWER($5))
    GROUP BY rt.id, ri.total_units
    ORDER BY rt.name`;

  const result = await query(sql, [propertyId, start, end, Number(guestsCount), roomType || null]);
  return result.rows.map((r) => ({
    ...r,
    total_units: Number(r.total_units),
    reserved_units: Number(r.reserved_units),
    available_units: Math.max(0, Number(r.total_units) - Number(r.reserved_units)),
    check_in: start,
    check_out: end,
    nights: nightsBetween(start, end),
  }));
}

async function createBooking(input) {
  const propertyId = input.propertyId;
  const roomType = input.roomType;
  const checkIn = normalizeDate(input.checkIn);
  const checkOut = normalizeDate(input.checkOut);
  const guestsCount = Number(input.guestsCount || 1);
  const phone = normalizePhone(input.phone);

  if (!propertyId || !roomType || !checkIn || !checkOut || !input.guestName || !phone) {
    throw new Error('Missing required booking information');
  }
  if (nightsBetween(checkIn, checkOut) <= 0) throw new Error('Check-out must be after check-in');
  if (guestsCount < 1) throw new Error('Guest count must be at least 1');

  return withTransaction(async (client) => {
    // Do not use FOR UPDATE on a LEFT JOIN: PostgreSQL rejects locking the nullable side.
    // First locate the room type, then lock that room_types row separately.
    const roomResult = await client.query(
      `SELECT rt.*, COALESCE(ri.total_units,0) AS total_units
       FROM room_types rt
       LEFT JOIN room_inventory ri ON ri.room_type_id=rt.id
       WHERE rt.property_id=$1 AND rt.active=true AND LOWER(rt.name)=LOWER($2)`,
      [propertyId, roomType]
    );
    const room = roomResult.rows[0];
    if (!room) throw new Error('ROOM_TYPE_NOT_FOUND');

    await client.query(
      `SELECT id FROM room_types WHERE id=$1 FOR UPDATE`,
      [room.id]
    );
    if (guestsCount > Number(room.capacity_guests)) throw new Error('ROOM_CAPACITY_EXCEEDED');

    const reservedResult = await client.query(
      `SELECT COUNT(*)::int AS reserved_units
       FROM bookings
       WHERE property_id=$1 AND room_type_id=$2
         AND check_in < $4::date AND check_out > $3::date
         AND status IN ('pending','confirmed','checked_in')`,
      [propertyId, room.id, checkIn, checkOut]
    );
    const reserved = Number(reservedResult.rows[0].reserved_units);
    const totalUnits = Number(room.total_units);
    if (totalUnits <= reserved) throw new Error('NO_AVAILABILITY');

    const guestResult = await client.query(
      `INSERT INTO guests (name, phone, email)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [input.guestName.trim(), phone, input.email || null]
    );
    const guest = guestResult.rows[0];

    const nights = nightsBetween(checkIn, checkOut);
    const isForeign = String(input.currency || 'TZS').toUpperCase() === 'USD';
    const nightlyRate = Number(isForeign ? room.price_foreigner_usd : room.price_resident_tzs);
    const currency = isForeign ? 'USD' : 'TZS';
    const total = nightlyRate * nights;
    const reference = `ELCT-${new Date().getUTCFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const bookingResult = await client.query(
      `INSERT INTO bookings
       (booking_reference, guest_id, property_id, room_type_id, check_in, check_out, guests_count, status, currency, nightly_rate, total_amount, source, special_requests)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed',$8,$9,$10,'website_chatbot',$11)
       RETURNING *`,
      [reference, guest.id, propertyId, room.id, checkIn, checkOut, guestsCount, currency, nightlyRate, total, input.specialRequests || null]
    );

    return { ...bookingResult.rows[0], guest, room_type: room.name, property_name: input.propertyName || null, nights };
  });
}

async function getBooking(reference) {
  const result = await query(
    `SELECT b.*, g.name AS guest_name, g.phone, g.email,
            rt.name AS room_type, p.name AS property_name
     FROM bookings b
     JOIN guests g ON g.id=b.guest_id
     JOIN room_types rt ON rt.id=b.room_type_id
     JOIN properties p ON p.id=b.property_id
     WHERE b.booking_reference=$1`,
    [reference]
  );
  return result.rows[0] || null;
}


function serviceTypeFromInput(type) {
  const value = String(type || '').trim().toLowerCase();
  const aliases = {
    car: 'car_hire', 'car_hire': 'car_hire', 'car hire': 'car_hire',
    conference: 'conference', 'conference_hall': 'conference', 'hall': 'conference',
    tour: 'tour', 'tours': 'tour',
    service: 'extra_service', 'extra_service': 'extra_service', 'extra services': 'extra_service',
  };
  return aliases[value] || value;
}

async function createServiceRequest(input) {
  const type = serviceTypeFromInput(input.type);
  const allowed = ['car_hire', 'conference', 'tour', 'extra_service'];
  if (!allowed.includes(type)) throw new Error('INVALID_SERVICE_TYPE');
  const guestName = String(input.guestName || '').trim();
  const phone = normalizePhone(input.phone);
  if (!guestName || !phone) throw new Error('Missing required guest information');

  const propertyId = input.propertyId || null;
  const details = input.details && typeof input.details === 'object' ? input.details : {};
  const year = new Date().getUTCFullYear();
  const prefix = type === 'car_hire' ? 'C' : type === 'conference' ? 'H' : type === 'tour' ? 'T' : 'S';
  const reference = `ELCT-${prefix}-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

  return withTransaction(async (client) => {
    const guestResult = await client.query(
      `INSERT INTO guests (name, phone, email, country) VALUES ($1,$2,$3,$4) RETURNING *`,
      [guestName, phone, input.email || null, input.country || null]
    );
    const guest = guestResult.rows[0];
    const requestResult = await client.query(
      `INSERT INTO requests (guest_id, property_id, type, reference, quoted_amount, currency, status, details, source)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,'website_chatbot') RETURNING *`,
      [guest.id, propertyId, type, reference, input.quotedAmount != null ? Number(input.quotedAmount) : null,
       input.currency ? String(input.currency).toUpperCase() : null, JSON.stringify(details)]
    );
    return { ...requestResult.rows[0], guest };
  });
}

module.exports = { availability, createBooking, getBooking, findRoomType, createServiceRequest };
