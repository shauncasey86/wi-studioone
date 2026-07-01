-- New bookings now default to RESERVED (held while the guest arranges payment).
-- Split from the previous migration because Postgres cannot use a freshly added
-- enum value in the same transaction that added it.
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'RESERVED';
