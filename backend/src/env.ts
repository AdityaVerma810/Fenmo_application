import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATA_DIR: z.string().default(".data"),
  CORS_ORIGIN: z.string().default("http://localhost:5173")
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(input: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(input);
}

