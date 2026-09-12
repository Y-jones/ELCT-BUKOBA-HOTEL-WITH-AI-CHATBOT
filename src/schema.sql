CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL REFERENCES properties(id),
  name TEXT NOT NULL,
  description TEXT,
  capacity_guests INTEGER NOT NULL CHECK (capacity_guests > 0),
  beds INTEGER NOT NULL DEFAULT 1 CHECK (beds > 0),
  price_foreigner_usd NUMERIC(12,2),
  price_resident_tzs NUMERIC(12,2),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(property_id, name)
);

CREATE TABLE IF NOT EXISTS room_inventory (
  room_type_id UUID PRIMARY KEY REFERENCES room_types(id) ON DELETE CASCADE,
  total_units INTEGER NOT NULL DEFAULT 0 CHECK (total_units >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guests_phone_idx ON guests(phone);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  guest_id UUID NOT NULL REFERENCES guests(id),
  property_id TEXT NOT NULL REFERENCES properties(id),
  room_type_id UUID NOT NULL REFERENCES room_types(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER NOT NULL CHECK (guests_count > 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','checked_in','checked_out','expired')),
  currency TEXT CHECK (currency IN ('TZS','USD')),
  nightly_rate NUMERIC(12,2),
  total_amount NUMERIC(12,2),
  source TEXT NOT NULL DEFAULT 'website_chatbot',
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS bookings_dates_idx ON bookings(property_id, room_type_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS bookings_guest_idx ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id),
  property_id TEXT REFERENCES properties(id),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'website_chatbot',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
