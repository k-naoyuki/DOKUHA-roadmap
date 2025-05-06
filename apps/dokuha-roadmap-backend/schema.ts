import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable(
    "users",
    {
        id: text("id").primaryKey(),
        nickname: text("nickname").notNull(),
        email: text("email").unique().notNull(),
        // 注意: パスワードはプレーンテキストではなく、必ずハッシュ化して保存してください。
        password: text("password").notNull(),
        readingMission: text("reading_mission").notNull(),

        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
        updatedAt: text("updated_at")
            .default(sql`CURRENT_TIMESTAMP`),
    }
);

export const learningContents = sqliteTable(
    "learning_contents",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id),
        title: text("title").notNull(),
        totalPage: integer("total_page").notNull().default(1),
        currentPage: integer("current_page").notNull().default(1),
        note: text("note").notNull().default(''),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
        updatedAt: text("updated_at")
            .default(sql`CURRENT_TIMESTAMP`),
    }
);
