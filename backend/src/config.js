import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("12h"),
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string().min(8),
  NANOMDM_URL: z.string().url(),
  NANOMDM_API_KEY: z.string().min(16),
  DOMAIN: z.string().min(1),
  APNS_CERT_PATH: z.string().default("/app/certs/apns/apns.pem"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200)
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast on invalid env to avoid undefined runtime behavior.
  throw new Error(`Invalid environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
}

export const config = parsed.data;
