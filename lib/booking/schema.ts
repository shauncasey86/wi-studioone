import { z } from "zod";

// Validates POST /api/bookings input. `company` is a honeypot: real users leave
// it empty; a filled value is treated as spam.
export const bookingInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startHour: z.number().int().min(0).max(23),
  hours: z.number().int().min(1).max(24),
  company: z.string().optional(), // honeypot
});

export type BookingInput = z.infer<typeof bookingInputSchema>;
