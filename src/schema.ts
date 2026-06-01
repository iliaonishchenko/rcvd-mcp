import { z } from "zod";

export const PRIORITY_VALUES = ["info", "normal", "needs_attention", "done"] as const;
export type Priority = (typeof PRIORITY_VALUES)[number];

// Bounds mirror the rcvd API (POST /v1/send) so obviously-invalid input fails
// locally instead of round-tripping to a 400. The server remains the authority.
export const sendNotificationInputSchema = z.strictObject({
  text: z
    .string()
    .min(1, "text must not be empty")
    .max(4096, "text must be at most 4096 characters"),
  priority: z.enum(PRIORITY_VALUES).optional(),
  title: z
    .string()
    .min(1, "title must not be empty when provided")
    .max(100, "title must be at most 100 characters")
    .optional(),
  channels: z
    .array(z.string().min(1))
    .min(1, "channels must contain at least one entry when provided")
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationInputSchema>;
