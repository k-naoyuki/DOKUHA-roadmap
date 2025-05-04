import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// NOTE: users は $onUpdate のところがうまくいかなかったので、カスタムで SQL を発行する方針にした
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

// // --- アプリケーション側の挿入処理の例 ---
// import { randomUUID } from 'node:crypto';
// async function createUser(db, userData) {
//   const userId = randomUUID(); // アプリケーションでUUIDを生成
//   const hashedPassword = await hashPasswordFunction(userData.password); // パスワードをハッシュ化

//   await db.insert(users).values({
//     id: userId, // 生成したUUIDを指定
//     nickname: userData.nickname,
//     email: userData.email,
//     password: hashedPassword, // ハッシュ化済みパスワード
//     readingMission: userData.readingMission,
//     // createdAt と updatedAt はDBのデフォルト/トリガーに任せる
//   });

//   console.log(`User created with ID: ${userId}`);
//   return userId;
// }