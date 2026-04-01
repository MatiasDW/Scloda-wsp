import { config } from "dotenv";
import { z } from "zod";

config();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  ADMIN_API_KEY: z.string().min(4).default("dev-admin-key"),
  WHATSAPP_MOCK_MODE: booleanFromEnv.default(true),
  WEBHOOK_SECRET: z.string().min(4).default("change-me"),
  KAPSO_API_KEY: z.string().optional(),
  KAPSO_SEND_MESSAGE_URL: z.string().url().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
