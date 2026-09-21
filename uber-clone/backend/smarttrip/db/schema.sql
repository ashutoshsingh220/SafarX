-- SmartTrip AI — New Tables
-- These are ADDITIVE tables. Existing User/Ride schemas are NOT altered.
-- Run against NeonDB alongside the existing uber-clone tables.

-- ============================================================
-- Boarding Points (bus stops, railway stations, airports)
-- ============================================================
CREATE TABLE IF NOT EXISTS boarding_points (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lon             DOUBLE PRECISION NOT NULL,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('bus_stop', 'railway_station', 'airport')),
    address         TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boarding_points_city ON boarding_points(city);
CREATE INDEX IF NOT EXISTS idx_boarding_points_type ON boarding_points(type);

-- ============================================================
-- Buses (inter-city bus services)
-- ============================================================
CREATE TABLE IF NOT EXISTS buses (
    id              SERIAL PRIMARY KEY,
    operator        VARCHAR(255) NOT NULL,
    bus_type        VARCHAR(50) NOT NULL,       -- 'sleeper', 'semi-sleeper', 'seater', 'ac-sleeper'
    origin_city     VARCHAR(100) NOT NULL,
    dest_city       VARCHAR(100) NOT NULL,
    origin_stop_id  INTEGER REFERENCES boarding_points(id),
    dest_stop_id    INTEGER REFERENCES boarding_points(id),
    departure_time  TIME NOT NULL,
    arrival_time    TIME NOT NULL,
    duration_hrs    DECIMAL(4,1) NOT NULL,
    fare_inr        INTEGER NOT NULL,           -- Fare in paisa (e.g., 80000 = ₹800)
    available_seats INTEGER DEFAULT 40,
    amenities       TEXT[],                      -- ARRAY of amenities
    rating          DECIMAL(2,1) DEFAULT 0.0,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buses_route ON buses(origin_city, dest_city);

-- ============================================================
-- Feeder Shuttles (shared last-mile vehicles)
-- ============================================================
CREATE TABLE IF NOT EXISTS feeder_shuttles (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    corridor_origin INTEGER REFERENCES boarding_points(id),
    corridor_dest   INTEGER REFERENCES boarding_points(id),
    vehicle_type    VARCHAR(30) NOT NULL CHECK (vehicle_type IN ('shuttle', 'shared_auto', 'e-rick')),
    fare_per_seat   INTEGER NOT NULL DEFAULT 5000,  -- ₹50 in paisa
    capacity        INTEGER NOT NULL DEFAULT 6,
    operating_hours VARCHAR(50) DEFAULT '06:00-23:00',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Memberships (SmartTrip subscription plans)
-- ============================================================
CREATE TABLE IF NOT EXISTS memberships (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(255) NOT NULL,          -- Clerk user_id (FK by convention, not altered)
    plan            VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'plus', 'premium')),
    price_inr       INTEGER NOT NULL DEFAULT 0,     -- Monthly price in paisa
    pickup_cap_inr  INTEGER,                        -- Max pickup fare in paisa (null = no cap)
    starts_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMP NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

-- ============================================================
-- SmartTrip Bookings (bundles: bus + last-mile)
-- ============================================================
CREATE TABLE IF NOT EXISTS smarttrip_bookings (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(255) NOT NULL,
    bus_id          INTEGER REFERENCES buses(id),
    origin_address  TEXT NOT NULL,
    dest_address    TEXT NOT NULL,
    pickup_lat      DOUBLE PRECISION,
    pickup_lon      DOUBLE PRECISION,
    dropoff_lat     DOUBLE PRECISION,
    dropoff_lon     DOUBLE PRECISION,
    bus_fare_inr    INTEGER NOT NULL,
    ride_fare_inr   INTEGER NOT NULL,
    discount_inr    INTEGER DEFAULT 0,
    total_fare_inr  INTEGER NOT NULL,
    payment_status  VARCHAR(20) DEFAULT 'pending',
    booking_time    TIMESTAMP DEFAULT NOW(),
    pickup_time     TIMESTAMP,
    stripe_payment_intent_id VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smarttrip_bookings_user ON smarttrip_bookings(user_id);
