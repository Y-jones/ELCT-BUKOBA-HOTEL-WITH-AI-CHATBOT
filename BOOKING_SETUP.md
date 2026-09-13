# ELCT Bukoba — live booking backend setup

The project now contains the first real booking layer:

- PostgreSQL schema in `src/schema.sql`
- Automatic schema/reference-data initialization in `src/dbInit.js`
- Availability + booking service in `src/bookingService.js`
- REST endpoints in `src/routes/bookings.js`
- Booking confirmation ticket text + WhatsApp Cloud API sender in `src/whatsapp.js`
- Chatbot booking-data handoff in `src/routes/chat.js`

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` values into the deployment environment. Never commit `.env`.

Required for database-backed bookings:

- `DATABASE_URL`
- `DATABASE_SSL=true` for most hosted PostgreSQL providers

Required for automatic WhatsApp confirmations:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_API_VERSION` (default `v23.0`)

## 3. Configure real room inventory

The hotel website publishes room types and prices, but it does not provide the number of physical units per room type. The initializer therefore creates each room type with `total_units = 0` rather than inventing inventory.

Before accepting real bookings, set the actual number of sellable units in `room_inventory` for each property/room type.

Example:

```sql
UPDATE room_inventory ri
SET total_units = 4, updated_at = NOW()
FROM room_types rt
WHERE ri.room_type_id = rt.id
  AND rt.property_id = 'bukoba_main'
  AND rt.name = 'Double Room';
```

Do this with the hotel's real inventory values.

## 4. Endpoints added

- `GET /api/bookings/availability?property_id=bukoba_main&room_type=Double%20Room&check_in=2026-09-18&check_out=2026-09-21&guests=2`
- `POST /api/bookings`
- `GET /api/bookings/:reference`

## 5. Booking confirmation flow

The chatbot proposes structured `BOOKING_DATA`. The backend then validates the fields, locks the room-type inventory row, checks overlapping bookings, creates the booking, generates an `ELCT-YYYY-######` reference, and attempts the WhatsApp confirmation.

A WhatsApp failure does **not** cancel an otherwise successful booking. The booking remains confirmed and the failure is recorded in `notification_log` for retry/operations work.
