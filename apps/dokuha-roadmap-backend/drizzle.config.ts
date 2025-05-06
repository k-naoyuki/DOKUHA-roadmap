import type { Config } from "drizzle-kit";

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/1b52ece63023367627078964169e02f25e79862c5fb40a72236be4f7aebd8b9e.sqlite",
  },
} satisfies Config;
