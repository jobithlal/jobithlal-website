import { z } from "zod";

/** Labels for the original services' contact values (kept for older inquiries). Live options come from the Services admin. */
export const serviceOptions = [
  { value: "reels", label: "Social Media Reel Creation" },
  { value: "motion", label: "Motion Graphics" },
  { value: "website", label: "Website Development" },
  { value: "multiple", label: "Multiple Services" },
] as const;

export const budgetOptions = [
  "Under QAR 5,000",
  "QAR 5,000 – 15,000",
  "QAR 15,000 – 40,000",
  "QAR 40,000+",
  "Not sure yet",
] as const;

export const timelineOptions = ["As soon as possible", "Within 1 month", "1–3 months", "Flexible"] as const;

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200),
  service: z.string({ message: "Please choose a service." }).trim().min(1, "Please choose a service.").max(60),
  details: z.string().trim().min(20, "Please share a little more about your project (20+ characters).").max(5000),
  company: optional(160),
  phone: optional(40).refine((v) => !v || /^[+\d][\d\s()-]{5,}$/.test(v), "Please enter a valid phone number."),
  budget: z.enum(budgetOptions).optional().or(z.literal("").transform(() => undefined)),
  timeline: z.enum(timelineOptions).optional().or(z.literal("").transform(() => undefined)),
  sourcePage: z.string().max(300).optional(),
});

export type Inquiry = z.infer<typeof inquirySchema>;

export type ContactState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "invalid"; message: string; fieldErrors: Record<string, string[] | undefined> }
  | { status: "unavailable" | "error"; message: string; fallback: { mailto: string; whatsapp: string } };
