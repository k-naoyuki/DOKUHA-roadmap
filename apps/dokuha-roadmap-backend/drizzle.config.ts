import type { Config } from "drizzle-kit";

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    // NOTE: 開発用の D1_PRODUCTION_DB_ID という命名でローカル DB を作成した場合、以下の名前で .sqlite ファイルが作成される
    url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/452ecafc4500a35827af44758854d2db3122cb82afaa35f19f9834426ee79073.sqlite",
  },
} satisfies Config;
