import { SELF, env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";

// @ts-expect-error: TypeScript might not know how to handle '?raw' imports for JSON without specific vite plugin/setup for JSON type.
// However, journalJsonContent is parsed by JSON.parse, so string type is fine.
import journalJsonContent from '../drizzle/meta/_journal.json?raw';

// @ts-expect-error: TypeScript might not know how to handle '?raw' imports for SQL without a custom.d.ts for '*.sql?raw'
// However, seedSqlContent is treated as a string, which is fine.
import seedSqlContent from '../seed.sql?raw';

declare module "cloudflare:test" {
  interface ProvidedEnv {
    productionDB: D1Database;
  }
}

// Vite固有: import.meta.glob の型宣言を追加
declare global {
  interface ImportMeta {
    glob: (pattern: string, options?: { as?: string; eager?: boolean }) => Record<string, any>;
  }
}

// import.meta.glob を使って drizzle ディレクトリ内の .sql ファイルを動的に読み込む
// eager: true にすると、モジュールがPromiseではなく直接返される
// as: 'raw' でファイル内容を文字列として取得
const migrationModules = import.meta.glob('../drizzle/*.sql', { as: 'raw', eager: true });
const migrationFileContents: Record<string, string> = {};
for (const path in migrationModules) {
  const fileName = path.split('/').pop(); // path (例: ../drizzle/0000_open_starhawk.sql) からファイル名を取得
  if (fileName) {
    migrationFileContents[fileName] = migrationModules[path];
  }
}
// これで migrationFileContents に {'0000_open_starhawk.sql': "SQL content...", '0001_exotic_adam_warlock.sql': "SQL content..."} が入ります。

// SQLを1行に整形するヘルパー関数
function singleLineSql(sql: string): string {
  return sql.replace(/\r\n?|\n/g, " ").replace(/\s\s+/g, " ").trim();
}

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
    const fileContent = migrationFileContents[fileName]; // 動的に読み込んだ内容を使用
    if (!fileContent) {
      console.error(`SQL content for ${fileName} not found in imported map.`);
      throw new Error(`Missing SQL content for migration: ${fileName}`);
    }

    console.log(`Executing migration file: ${fileName}`);

		// マイグレーションファイルを "--> statement-breakpoint" で分割
    // マーカーがない場合はファイル全体を一つのブロックとして扱う
    const sqlBlocks = fileContent.includes("--> statement-breakpoint")
      ? fileContent.split("--> statement-breakpoint").map(block => block.trim()).filter(block => block.length > 0)
      : [fileContent.trim()];

    for (let i = 0; i < sqlBlocks.length; i++) {
      const sqlBlock = sqlBlocks[i];
      let sqlToExecuteAttempt = sqlBlock;

      try {
        console.log(`  Executing block ${i + 1} of ${sqlBlocks.length} from ${fileName}`);

        // ブロックの内容に基づいて実行戦略を決定
				if (sqlBlock.toUpperCase().includes("CREATE TRIGGER")) {
          console.log(`    Attempting TRIGGER block with prepare().run()`);
          sqlToExecuteAttempt = sqlBlock;
          const stmt = d1db.prepare(sqlBlock);
          await stmt.run();
          console.log(`    TRIGGER block executed successfully with prepare().run().`);
        } else {
					// CREATE TABLE, CREATE INDEX など、その他のブロックは1行化して exec()
          console.log(`    Attempting non-TRIGGER block as a SINGLE LINE`);
          const singleLineBlock = singleLineSql(sqlBlock);
          sqlToExecuteAttempt = singleLineBlock;
          if (singleLineBlock.length > 0) { // 空のブロックを避ける
            await d1db.exec(singleLineBlock);
            console.log(`    Non-TRIGGER block executed successfully as single line.`);
          } else {
            console.log(`    Skipping empty block after single-lining.`);
          }
        }
        console.log(`  Block ${i + 1} executed successfully.`);
      } catch (e: any) {
        console.error(`  Failed to execute block ${i + 1} in ${fileName}. Error:`, e);
        const errorMessage = e.cause?.message || e.message || 'Unknown D1 error';
        throw new Error(`Migration failed for ${fileName}, block ${i + 1} (SQL attempted: ${sqlToExecuteAttempt.substring(0,150)}...): ${errorMessage}`);
      }
    }
    console.log(`Migration ${fileName} applied successfully.`);
  }
  console.log("All migrations applied.");

  // シードデータの投入
  if (seedSqlContent) {
    let sqlToExecuteAttempt = ""; 
    try {
      console.log("Applying seed data...");
      const seedStatements = seedSqlContent
        .split(';')
        .map((stmt: string) => stmt.trim())
        .filter((stmt: string | any[]) => stmt.length > 0);

      for (const statement of seedStatements) {
        sqlToExecuteAttempt = statement;
        console.log(`  Executing seed statement: ${statement.substring(0, 70)}...`);
        const singleLineStatement = singleLineSql(statement);
        if (singleLineStatement.length > 0) {
          await d1db.exec(singleLineStatement);
        }
      }
      console.log("Seed data inserted successfully.");
    } catch (e: any) {
      console.error(`Failed to insert seed data. Error:`, e);
      const errorMessage = e.cause?.message || e.message;
      if (errorMessage?.includes("UNIQUE constraint failed")) {
        console.warn("Warning: Seed data insertion caused a UNIQUE constraint failure.");
      } else {
				// sqlToExecuteAttempt はループ内で最後に試行されたステートメントを指す
        throw new Error(`Seed data insertion failed for statement (approx): ${sqlToExecuteAttempt.substring(0,150)}... Error: ${errorMessage}`);
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
  });
});