import { SELF, env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";

// @ts-expect-error: TypeScriptがJSONの'?raw'インポートを特定のViteプラグインや設定なしでは認識できない可能性があります。
// ただし、journalJsonContentはJSON.parseで解析されるため、文字列型で問題ありません。
import journalJsonContent from '../drizzle/meta/_journal.json?raw';

// @ts-expect-error: TypeScriptがSQLの'?raw'インポートを特定のカスタム型定義なしでは認識できない可能性があります。
// ただし、seedSqlContentは文字列として扱われるため問題ありません。
import seedSqlContent from '../seed.sql?raw';

declare module "cloudflare:test" {
  interface ProvidedEnv {
    productionDB: D1Database;
  }
}

// Vite固有: import.meta.glob の型宣言を追加
declare global {
  interface ImportMeta {
    glob: (pattern: string, options?: { query?: string; eager?: boolean; import?: string }) => Record<string, any>;
  }
}

// import.meta.glob を使って drizzle ディレクトリ内の .sql ファイルを動的に読み込む
// eager: true にすると、モジュールがPromiseではなく直接返される
// query: '?raw' でファイル内容を文字列として取得
// import: 'default' を指定することで、デフォルトエクスポートとして文字列を取得
	// これは、Viteのimport.meta.globが返す値がデフォルトエクスポートを含む場合に、
	// そのデフォルトエクスポートを直接取得するために必要です。
	// 例えば、?raw を使用してファイル内容を文字列としてインポートする場合、
	// デフォルトエクスポートとして文字列が提供されるため、import: 'default' を指定する必要があります。
const migrationModules = import.meta.glob('../drizzle/*.sql', { query: '?raw', eager: true, import: 'default' });
const migrationFileContents: Record<string, string> = {};
for (const path in migrationModules) {
  const fileName = path.split('/').pop(); // path (例: ../drizzle/0000_open_starhawk.sql) からファイル名を取得
  if (fileName) {
    const fileContent = migrationModules[path];
    if (typeof fileContent === 'string') {
      migrationFileContents[fileName] = fileContent;
    } else {
      console.error(`予期しないコンテンツタイプ: ${fileName}。文字列が期待されます。`);
      throw new Error(`マイグレーションファイルのコンテンツタイプが無効です: ${fileName}`);
    }
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
      throw new Error("drizzle/meta/_journal.json の形式が無効、またはエントリがありません。");
    }
  } catch (e) {
    console.error("drizzle/meta/_journal.json の解析に失敗しました。", e);
    throw new Error(`マイグレーションジャーナルの処理に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  console.log("_journal.json に基づいてマイグレーションを適用します...");
  for (const fileName of migrationFilesToApply) {
    const fileContent = migrationFileContents[fileName]; // 動的に読み込んだ内容を使用
    if (!fileContent) {
      console.error(`インポートされたマップに ${fileName} のSQLコンテンツが見つかりません。`);
      throw new Error(`マイグレーションが見つかりません: ${fileName}`);
    }

    console.log(`マイグレーションファイルを実行中: ${fileName}`);

    // マイグレーションファイルを "--> statement-breakpoint" で分割
    // マーカーがない場合はファイル全体を一つのブロックとして扱う
    const sqlBlocks = fileContent.includes("--> statement-breakpoint")
      ? fileContent.split("--> statement-breakpoint").map(block => block.trim()).filter(block => block.length > 0)
      : [fileContent.trim()];

    for (let i = 0; i < sqlBlocks.length; i++) {
      const sqlBlock = sqlBlocks[i];
      let sqlToExecuteAttempt = sqlBlock;

      try {
        console.log(`  ${fileName} のブロック ${i + 1} / ${sqlBlocks.length} を実行中`);

        // ブロックの内容に基づいて実行戦略を決定
        if (sqlBlock.toUpperCase().includes("CREATE TRIGGER")) {
          console.log(`    TRIGGERブロックを prepare().run() で実行します`);
          sqlToExecuteAttempt = sqlBlock;
          const stmt = d1db.prepare(sqlBlock);
          await stmt.run();
          console.log(`    TRIGGERブロックが prepare().run() で正常に実行されました。`);
        } else {
          // CREATE TABLE, CREATE INDEX など、その他のブロックは1行化して exec()
          console.log(`    TRIGGER以外のブロックを1行化して exec() で実行します`);
          const singleLineBlock = singleLineSql(sqlBlock);
          sqlToExecuteAttempt = singleLineBlock;
          if (singleLineBlock.length > 0) { // 空のブロックを避ける
            await d1db.exec(singleLineBlock);
            console.log(`    TRIGGER以外のブロックが1行化され、exec() で正常に実行されました。`);
          } else {
            console.log(`    1行化後に空のブロックが検出されたためスキップします。`);
          }
        }
        console.log(`  ${fileName} のブロック ${i + 1} が正常に実行されました。`);
      } catch (e: any) {
        console.error(`  ${fileName} のブロック ${i + 1} の実行に失敗しました。エラー:`, e);
        const errorMessage = e.cause?.message || e.message || '不明なD1エラー';
        throw new Error(`マイグレーション ${fileName} のブロック ${i + 1} の実行に失敗しました (試行したSQL: ${sqlToExecuteAttempt.substring(0,150)}...)。エラー: ${errorMessage}`);
      }
    }
    console.log(`マイグレーション ${fileName} が正常に適用されました。`);
  }
  console.log("全てのマイグレーションが適用されました。");

  // シードデータの投入
  if (seedSqlContent) {
    let sqlToExecuteAttempt = ""; 
    try {
      console.log("シードデータを適用中...");
      const seedStatements = seedSqlContent
        .split(';')
        .map((stmt: string) => stmt.trim())
        .filter((stmt: string | any[]) => stmt.length > 0);

      for (const statement of seedStatements) {
        sqlToExecuteAttempt = statement;
        console.log(`  シードステートメントを実行中: ${statement.substring(0, 70)}...`);
        const singleLineStatement = singleLineSql(statement);
        if (singleLineStatement.length > 0) {
          await d1db.exec(singleLineStatement);
        }
      }
      console.log("シードデータが正常に挿入されました。");
    } catch (e: any) {
      console.error(`シードデータの挿入に失敗しました。エラー:`, e);
      const errorMessage = e.cause?.message || e.message;
      if (errorMessage?.includes("UNIQUE constraint failed")) {
        console.warn("警告: シードデータの挿入中にUNIQUE制約違反が発生しました。");
      } else {
        // sqlToExecuteAttempt はループ内で最後に試行されたステートメントを指す
        throw new Error(`シードデータの挿入に失敗しました (試行したSQL: ${sqlToExecuteAttempt.substring(0,150)}...)。エラー: ${errorMessage}`);
      }
    }
  } else {
    console.warn("シードSQLコンテンツが空、または見つからないため、シードデータの適用をスキップします。");
  }
});

describe("GET / Hello Hono", () => {
  it("200と 'Hello Hono!' を返す", async () => {
    const response = await SELF.fetch("http://localhost:8787/");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Hello Hono!");
  });
});

describe("GET /users", () => {
  it("200とユーザーリストを返す", async () => {
    const response = await SELF.fetch("http://localhost:8787/users");
    expect(response.status).toBe(200);
    const data: unknown = await response.json();
    expect(Array.isArray(data)).toBe(true);
    if (Array.isArray(data)) {
      expect(data.length).toBeGreaterThan(0);
    }
  });
});

// Define newUser at a higher scope to share between tests
const newUser = {
  email: `${Math.random().toString(36).substring(2, 10)}@example.com`,
  name: "Test User",
  nickname: "TestNickname",
  password: "password123",
  readingMission: "Complete 5 books",
};

describe("POST /users", () => {
  it("新しいユーザーを作成し、作成したユーザーを返す", async () => {
    const response = await SELF.fetch("http://localhost:8787/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUser),
    });
    expect(response.status).toBe(200);
    const data = await response.json() as {
      id: string;
      createdAt: string;
      updatedAt: string;
      email: string;
      nickname: string;
      password: string;
      readingMission: string;
      success: boolean;
    };
    console.log("レスポンスデータ:", data);
    expect(data).toHaveProperty("id");
    expect(data.id).toBeDefined();
    expect(data).toHaveProperty("createdAt");
    expect(data.createdAt).toBeDefined();
    expect(data).toHaveProperty("updatedAt");
    expect(data.updatedAt).toBeDefined();
    expect(data).toHaveProperty("email", newUser.email);
    expect(data).toHaveProperty("nickname", newUser.nickname);
    expect(data).toHaveProperty("readingMission", newUser.readingMission);
    expect(data).toHaveProperty("success", true);

    const userListResponse = await SELF.fetch("http://localhost:8787/users");
    expect(userListResponse.status).toBe(200);

    const userListDate: unknown = await userListResponse.json();
    console.log("GET /users レスポンスデータ:", userListDate);

    expect(Array.isArray(userListDate)).toBe(true);

    if (Array.isArray(userListDate)) {
      expect(userListDate.length).toBeGreaterThan(0);

      // 作成したユーザーを検索
      const createdUser = userListDate.find((user: { email: string }) => user.email === newUser.email);
      expect(createdUser).toBeDefined();
      expect(createdUser).toHaveProperty("nickname", newUser.nickname);
      expect(createdUser).toHaveProperty("readingMission", newUser.readingMission);
    }
  });
});
