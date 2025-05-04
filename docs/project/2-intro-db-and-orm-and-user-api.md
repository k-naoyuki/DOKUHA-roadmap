# DrizzleORM の導入と User API の実装

## データベース設計

### Users テーブル
- id (TEXT): プライマリーキー
- nickname (TEXT): ユーザーのニックネーム
- email (TEXT): メールアドレス（ユニーク制約あり）
- password (TEXT): ハッシュ化されたパスワード
- reading_mission (TEXT): 読書目標
- created_at (TEXT): 作成日時
- updated_at (TEXT): 更新日時（自動更新）

## API エンドポイント

### GET /users
- 全ユーザー情報の取得
- レスポンス: ユーザー情報の配列

### POST /users
- 新規ユーザーの作成
- リクエストボディ: ユーザー情報（nickname, email, password, readingMission）
- レスポンス: 作成されたユーザーのID

## セキュリティ対策

### パスワードのハッシュ化
- PBKDF2アルゴリズムを使用
- ソルトを使用して安全性を向上
- 1000回のイテレーション

#### 実装の詳細
1. **PBKDF2 (Password-Based Key Derivation Function 2)**
   - 暗号学的に安全なパスワードハッシュ関数
   - パスワードからキーを導出する標準的なアルゴリズム
   - 計算コストが高く、総当たり攻撃に対して耐性がある

2. **ソルトの使用**
   - 128ビットのランダムなソルトを生成
   - 同じパスワードでも毎回異なるハッシュ値を生成
   - レインボーテーブル攻撃への対策
   ```typescript
   const salt = crypto.lib.WordArray.random(128 / 8).toString();
   ```

3. **イテレーション**
   - 1000回の反復処理を実施
   - ブルートフォース攻撃に対する耐性を向上
   - ハッシュの計算に意図的な遅延を導入
   ```typescript
   crypto.PBKDF2(password, salt, {
     keySize: 256 / 32,
     iterations: 1000,
   })
   ```

4. **保存形式**
   - ソルトとハッシュ値を結合して保存: `${salt}:${hashedPassword}`
   - 検証時にソルトを分離して再計算が可能
   - データベースに保存される際は不可逆的な形式

#### セキュリティ上の考慮事項
- イテレーション回数は将来的に調整可能な設計
- パスワード強度のバリデーションを別途実装することを推奨
- 平文パスワードはメモリ上でも最小限の時間だけ保持

### エラーハンドリング
- メールアドレスの重複チェック
- バリデーションエラーの適切な処理
- 予期せぬエラーのログ記録

## 技術スタック

- DrizzleORM: SQLiteデータベース操作
- Cloudflare D1: データベースサービス
- Hono: Web フレームワーク
- crypto-js: パスワードハッシュ化
- uuid: ユニークID生成

## マイグレーション管理

マイグレーションコマンド:
```bash
# ローカル環境での適用
npm run local:migration

# 本番環境での適用
npm run remote:migration
```

## ログイン実装時の注意点

### パスワード検証プロセス
1. **タイミング攻撃対策**
   - パスワード比較時は定数時間比較を使用
   - 存在しないユーザーの場合も同じ処理時間を確保

2. **ブルートフォース対策**
   - ログイン試行回数の制限を実装
   - 一定回数の失敗後にアカウントを一時的にロック
   - レート制限の実装を推奨

3. **セッション管理**
   - JWTトークンを使用する場合は適切な有効期限を設定
   - セッションIDは十分なエントロピーを確保
   - トークンのローテーションを実装

4. **エラーメッセージ**
   - 「メールアドレスが存在しない」「パスワードが間違っている」など個別のエラーは表示しない
   - 代わりに「メールアドレスまたはパスワードが正しくありません」など一般的なメッセージを使用

5. **ログイン情報の保護**
   - HTTPS通信の強制
   - パスワードリセット機能の適切な実装
   - 二要素認証の検討

### 実装例（疑似コード）
```typescript
/**
 * 入力パスワードが保存されたハッシュと一致するか検証する (Node.js crypto を使用)
 * @param storedHash "salt(hex):hash(hex)" 形式で保存された文字列
 * @param inputPassword ユーザーが入力したパスワード
 * @returns 一致すれば true、しなければ false の Promise
 */
function verifyPassword(storedHash: string, inputPassword: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!storedHash || !inputPassword) {
        return resolve(false); // or reject(new Error(...))
    }
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
        // 不正な形式のハッシュ
        console.error("Invalid stored hash format");
        return resolve(false); // or reject(new Error(...))
    }
    const [saltHex, storedKeyHex] = parts;

    // 16進数文字列から Buffer に戻す
    const salt = Buffer.from(saltHex, 'hex');
    const storedKey = Buffer.from(storedKeyHex, 'hex');

    // 同じパラメータで入力パスワードのハッシュを計算
    crypto.pbkdf2(
      inputPassword,
      salt,
      HASH_ITERATIONS,
      HASH_KEYLEN,
      HASH_DIGEST,
      (err, derivedKey) => {
        if (err) {
          return reject(err);
        }

        // timingSafeEqual は同じ長さの Buffer を期待する
        if (storedKey.length !== derivedKey.length) {
          console.error("Stored key length does not match derived key length.");
          return resolve(false);
        }

        // 安全な比較 (タイミング攻撃対策)
        const match = crypto.timingSafeEqual(storedKey, derivedKey);
        resolve(match);
      }
    );
  });
}
```
