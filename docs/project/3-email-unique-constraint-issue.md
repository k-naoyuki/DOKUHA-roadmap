# メールアドレス重複時のエラーハンドリング問題

## 現状の問題
現在のcreateUser関数では、同じメールアドレスでユーザー登録を試みた際に適切なエラーハンドリングができていません。
これは以下の理由によるものです：

1. SQLiteのUNIQUE制約違反時に発生する例外をキャッチしていない
2. エラーが発生しても、適切なエラーメッセージをクライアントに返していない

## 解決策

1. try-catch文を使用して、UNIQUE制約違反のエラーをキャッチする
2. エラーの種類に応じて適切なエラーメッセージを返す
3. カスタムエラークラスを作成して、アプリケーション固有のエラーを定義する

## 実装方針

```typescript
class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email ${email} is already registered`);
    this.name = 'DuplicateEmailError';
  }
}
```

このカスタムエラーを使用して、createUser関数でエラーハンドリングを実装します。

## 追加調査：エラーハンドリングが機能していない問題

### 問題の特定
1. createUser関数内でエラーをthrowしているが、APIエンドポイントのハンドラーでそのエラーを適切にキャッチ・処理していない
2. エラーが発生しても、デフォルトの200 OKレスポンスが返されている

### 解決策
1. APIエンドポイントのハンドラーでtry-catchブロックを実装
2. エラーの種類に応じて適切なHTTPステータスコードを返す

### 実装例
```typescript
app.post('/users', async (c) => {
  try {
    const body = await c.req.json();
    const userId = await createUser(db, body);
    return c.json({ success: true, userId });
  } catch (error) {
    if (error.message?.includes('already registered')) {
      return c.json(
        { success: false, error: error.message },
        { status: 409 } // Conflict
      );
    }
    // その他の予期せぬエラー
    return c.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
```

このように、エラーハンドリングは以下の3層で適切に実装する必要があります：
1. データベース操作層（createUser関数内）
2. APIエンドポイントハンドラー層
3. クライアントでのエラーハンドリング層

## 実装の振り返りと成果

### 実装したファイル構成
1. `src/errors.ts` - カスタムエラークラスの定義
2. `src/users.ts` - ユーザー作成ロジックとエラーハンドリング
3. `src/index.ts` - APIエンドポイントでのエラーハンドリング

### 実装のポイント
1. **エラーの層別管理**
   - DB層: SQLiteのUNIQUE制約違反を検知
   - ビジネスロジック層: カスタムエラー（DuplicateEmailError）に変換
   - API層: HTTPステータスコード（409 Conflict）とエラーメッセージの返却

2. **型安全性の向上**
   - カスタムエラークラスの導入により、エラーの種類を型で判別可能に
   - instanceof による型チェックが可能に

3. **エラーメッセージの統一**
   - ユーザーフレンドリーなメッセージを返却
   - システムエラーとビジネスロジックエラーを分離

### 動作確認結果
1. **正常系**
   - 新規ユーザー登録時：200 OKとユーザーID返却
   ```json
   {"success":true,"userId":"0cfa85e9-a90a-4baf-a664-726e5beabb33"}
   ```

2. **異常系**
   - メールアドレス重複時：409 Conflictとエラーメッセージ返却
   ```json
   {"success":false,"error":"Email test2@example.com is already registered"}
   ```

### 学んだこと
1. エラーハンドリングは各層で適切に処理する必要がある
2. カスタムエラーを使用することで、型安全性とコードの可読性が向上する
3. HTTPステータスコードを適切に使用することで、APIのセマンティクスが向上する

## 今後の改善点

### 1. 型安全性の強化
1. **入力値のバリデーション**
   - メールアドレスのフォーマット検証
   - パスワードの強度チェック
   - zod などのバリデーションライブラリの導入検討

2. **API型定義の整備**
   - リクエスト/レスポンスの型定義
   - OpenAPI/Swagger による API ドキュメント生成

### 2. エラーハンドリングの拡充
1. **カスタムエラーの体系化**
   - ValidationError
   - NotFoundError
   - など、アプリケーション固有のエラー体系の整備

2. **エラーログの充実**
   - エラー発生時のコンテキスト情報の記録
   - 構造化ログの導入

### 3. セキュリティ強化
1. **パスワード管理**
   - パスワードハッシュ化のパラメータ最適化
   - パスワードポリシーの実装

2. **レート制限**
   - ユーザー登録APIへのレート制限実装
   - 同一IPからのリクエスト制限

### 4. テストの充実
1. **単体テスト**
   - エラーケースのテスト
   - バリデーションのテスト

2. **統合テスト**
   - APIエンドポイントの E2E テスト
   - データベース操作を含むテスト
