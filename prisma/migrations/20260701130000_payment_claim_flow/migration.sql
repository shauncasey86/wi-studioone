-- Add the RESERVED status: a pre-payment hold on the slot. New bookings start
-- here; the studio is only alerted once the guest says they've sent the transfer
-- (which moves the booking to PENDING). Added BEFORE PENDING for a natural order.
ALTER TYPE "BookingStatus" ADD VALUE 'RESERVED' BEFORE 'PENDING';

-- Timestamp for when the guest pressed "I've sent the payment".
ALTER TABLE "Booking" ADD COLUMN "paidClaimedAt" TIMESTAMP(3);
