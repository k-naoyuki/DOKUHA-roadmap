import { SELF, env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";

// ?raw インポート (journal.json と seed.sql のみ ?raw を使用)
// 型エラー回避: ?raw 付きJSONの型宣言
// @ts-expect-error: TypeScript does not know how to handle '?raw' imports for JSON
import journalJsonContent from '../drizzle/meta/_journal.json?raw';
// マイグレーションSQLファイルの内容はハードコードするため、以下の ?raw インポートは不要
// import migration0000_raw from '../drizzle/0000_open_starhawk.sql?raw';
// import migration0001_raw from '../drizzle/0001_exotic_adam_warlock.sql?raw';
// @ts-expect-error: TypeScript does not know how to handle '?raw' imports for SQL
import seedSqlContent from '../seed.sql?raw';

// envの型を拡張してproductionDBを追加
declare module "cloudflare:test" {
  interface ProvidedEnv {
    productionDB: D1Database;
  }
}

// SQLファイルをハードコード (ファイルから正確にコピー＆ペーストしてください)
const migration0000_sql_statements = {
  createTable: `CREATE TABLE \`users\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`nickname\` text NOT NULL,
  \`email\` text NOT NULL,
  \`password\` text NOT NULL,
  \`reading_mission\` text NOT NULL,
  \`created_at\` text DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` text DEFAULT CURRENT_TIMESTAMP
);`,
  createIndex: `CREATE UNIQUE INDEX \`users_email_unique\` ON \`users\` (\`email\`);`,
  createTrigger: `CREATE TRIGGER \`update_users_updated_at\`
AFTER UPDATE ON \`users\` FOR EACH ROW
BEGIN
    UPDATE \`users\` SET \`updated_at\` = CURRENT_TIMESTAMP WHERE \`id\` = OLD.\`id\`;
END;`
};

const migration0001_sql_statements = {
  createTableLearningContents: `CREATE TABLE \`learning_contents\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`user_id\` text NOT NULL,
  \`title\` text NOT NULL,
  \`total_page\` integer DEFAULT 1 NOT NULL,
  \`current_page\` integer DEFAULT 1 NOT NULL,
  \`note\` text DEFAULT '' NOT NULL,
  \`created_at\` text DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action
);`,
  createTriggerLearningContents: `CREATE TRIGGER \`update_learning_contents_updated_at\`
AFTER UPDATE ON \`learning_contents\` FOR EACH ROW
BEGIN
    UPDATE \`learning_contents\` SET \`updated_at\` = CURRENT_TIMESTAMP WHERE \`id\` = OLD.\`id\`;
END;`
};


const migrationSqlMapForHardcoded: Record<string, any> = {
  '0000_open_starhawk.sql': migration0000_sql_statements,
  '0001_exotic_adam_warlock.sql': migration0001_sql_statements,
};


beforeAll(async () => {
  const d1db = env.productionDB as D1Database;

  let migrationFilesToApply: string[] = [];
  try {
    const journal = JSON.parse(journalJsonContent);
    if (journal.entries && Array.isArray(journal.entries)) {
      migrationFilesToApply = journal.entries.map((entry: { tag: string }) => `${entry.tag}.sql`);
    } else {
      throw new Error("drizzle/meta/_journal.json format is invalid or has no entries.");
    }
  } catch (e) {
    console.error("Failed to parse drizzle/meta/_journal.json.", e);
    throw new Error(`Could not process migrations journal: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  console.log("Applying migrations based on _journal.json...");
  for (const fileName of migrationFilesToApply) {
    const statementsToExecute = migrationSqlMapForHardcoded[fileName];
    if (!statementsToExecute) {
      console.error(`SQL statements for ${fileName} not found in hardcoded map.`);
      throw new Error(`Missing SQL content for migration: ${fileName}`);
    }

    console.log(`Executing migration file: ${fileName} (using hardcoded statements)`);

    for (const key in statementsToExecute) {
      const originalSqlStatement = statementsToExecute[key];
      let sqlToExecuteAttempt = originalSqlStatement; 

      try {
        console.log(`  Executing statement: ${key}`);
        
        if (fileName === '0000_open_starhawk.sql' && key === 'createTable') {
          // 超単純化SQL (これは検証済みなので、本番では不要かもしれないが、念のため残す)
          const ultraSimpleSql = "CREATE TABLE simplest_users_test_final_check (id TEXT PRIMARY KEY);";
          console.log(`    Attempting ULTRA SIMPLE SQL: ${ultraSimpleSql}`);
          sqlToExecuteAttempt = ultraSimpleSql;
          await d1db.exec(ultraSimpleSql);
          console.log(`    ULTRA SIMPLE SQL executed successfully.`);

          console.log(`    Now attempting original createTable as a SINGLE LINE:`);
          let singleLineCreateTableSql = migration0000_sql_statements.createTable
            .replace(/\r\n?|\n/g, " ") // 改行をスペースに置換
            .replace(/\s\s+/g, " ")   // 連続する空白を単一スペースに
            .trim();                 // 前後の空白をトリム
          sqlToExecuteAttempt = singleLineCreateTableSql;
          await d1db.exec(singleLineCreateTableSql);
          console.log(`    Single line createTable SQL executed successfully.`);
        
        } else if ((fileName === '0000_open_starhawk.sql' && key === 'createTrigger') ||
                   (fileName === '0001_exotic_adam_warlock.sql' && key === 'createTriggerLearningContents')) {
          // TRIGGERステートメントは prepare().run() を使用
          console.log(`    Attempting TRIGGER statement with prepare().run(): ${key}`);
          sqlToExecuteAttempt = originalSqlStatement; // 元の（複数行の）トリガーSQL
          const stmt = d1db.prepare(originalSqlStatement);
          await stmt.run();
          console.log(`    TRIGGER statement ${key} executed successfully with prepare().run().`);
        
        } else if (fileName === '0001_exotic_adam_warlock.sql' && key === 'createTableLearningContents') {
          // learning_contents テーブルも念のため1行化してexec
          console.log(`    Now attempting createTableLearningContents as a SINGLE LINE:`);
          let singleLineCreateTableSql = migration0001_sql_statements.createTableLearningContents
            .replace(/\r\n?|\n/g, " ") // 改行をスペースに置換
            .replace(/\s\s+/g, " ")   // 連続する空白を単一スペースに
            .trim();                 // 前後の空白をトリム
          sqlToExecuteAttempt = singleLineCreateTableSql;
          await d1db.exec(singleLineCreateTableSql);
          console.log(`    Single line createTableLearningContents SQL executed successfully.`);

        } else {
          // CREATE INDEX やその他の単純なステートメントは exec() で (以前のテストで成功していたため)
          sqlToExecuteAttempt = originalSqlStatement;
          await d1db.exec(originalSqlStatement);
        }
        
        console.log(`  Statement ${key} (or its version) executed successfully.`);

      } catch (e: any) {
        console.error(`  Failed to execute statement ${key} (or its version) in ${fileName}. Error:`, e);
        const errorMessage = e.cause?.message || e.message || 'Unknown D1 error';
        throw new Error(`Migration failed for ${fileName}, statement ${key} (SQL attempted: ${sqlToExecuteAttempt.substring(0,150)}...): ${errorMessage}`);
      }
    }
    console.log(`Migration ${fileName} applied successfully.`);
  }
  console.log("All migrations applied.");

  // シードデータの投入
  if (seedSqlContent) {
    try {
      console.log("Applying seed data...");
      // seedSqlContent をセミコロンで分割し、空のステートメントを除去
      const seedStatements = seedSqlContent
        .split(';')
        .map((stmt: string) => stmt.trim())
        .filter((stmt: string | any[]) => stmt.length > 0);

      for (const statement of seedStatements) {
        console.log(`  Executing seed statement: ${statement.substring(0, 60)}...`);
        // 各INSERTステートメントを個別に実行
        // INSERT文は通常1行にしても問題ないが、ここではそのままprepare().run()を試すのが安全か、
        // あるいは1行化してからexecでも良い。今回は prepare().run() を試す。
        const stmt = d1db.prepare(statement);
        await stmt.run();
      }
      console.log("Seed data inserted successfully.");
    } catch (e: any) {
      console.error(`Failed to insert seed data. Error:`, e);
      const errorMessage = e.cause?.message || e.message;
      if (errorMessage?.includes("UNIQUE constraint failed")) {
        console.warn("Warning: Seed data insertion caused a UNIQUE constraint failure. This might be due to re-running tests on a non-clean DB, or duplicate data in seed.sql.");
      } else {
        throw new Error(`Seed data insertion failed: ${errorMessage}`);
      }
    }
  } else {
    console.warn("Seed SQL content is empty or not found. Skipping seed data application.");
  }
});

describe("GET / Hello Hono", () => {
  it("should return 200 and 'Hello Hono!'", async () => {
    const response = await SELF.fetch("http://localhost:8787/");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Hello Hono!");
  });
});

describe("GET /users", () => {
  it("should return 200 and a list of users", async () => {
    const response = await SELF.fetch("http://localhost:8787/users");
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    // 必要であれば、さらにデータの内容を検証するアサーションを追加
    //例: if (data.length > 0) { expect(data[0]).toHaveProperty('id'); }
  });
});