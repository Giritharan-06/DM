import { z } from "zod";
export const agencyProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.union([z.literal(""), z.email()]).default(""),
  phone: z.string().trim().max(30).default(""),
  address: z.string().trim().max(600).default(""),
  gstin: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
          "Enter a valid GSTIN or leave it blank.",
        ),
    ])
    .default(""),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#ed704b"),
});
export type AgencyProfile = z.infer<typeof agencyProfileSchema>;
