# Issue #1: 認証・認可機能の実装計画

## 概要
学習コンテンツの権限管理のため、ユーザー認証・認可機能を実装する必要があります。

## 実装項目

### 1. ユーザー認証基盤の実装
- [ ] ログイン機能の実装
- [ ] セッション管理の実装
- [ ] JWTトークンの発行と検証

### 2. 権限チェック機能の実装
- [ ] ミドルウェアでの認証チェック
- [ ] ユーザーIDの検証
- [ ] コンテンツアクセス権限の検証

### 3. APIエンドポイントの更新
- [ ] 認証ヘッダーの追加
- [ ] ミドルウェアの適用
- [ ] エラーレスポンスの統一

## 実装手順

1. 認証基盤の実装
   - JWTを使用した認証の実装
   - ログインエンドポイントの作成
   - リフレッシュトークンの実装

2. ミドルウェアの実装
   ```typescript
   const authMiddleware = async (c, next) => {
     const token = c.req.header('Authorization');
     // トークン検証とユーザー情報の取得
   };
   ```

3. コンテンツアクセス制御の実装
   ```typescript
   const checkContentAccess = async (userId, contentId) => {
     // コンテンツの所有者確認
   };
   ```

## 現在の暫定実装

### APIリクエストヘッダー
現在は`X-User-Id`ヘッダーを使用してユーザー識別を行う予定です。

```typescript
// リクエストヘッダーの例
headers: {
  'X-User-Id': 'user-uuid',
  'Content-Type': 'application/json'
}
```

### 暫定的な権限チェック実装
```typescript
// ユーザーIDの検証
const userId = c.req.header('X-User-Id');
if (!userId) {
  return c.json({ 
    success: false, 
    error: 'User ID is required' 
  }, { status: 401 });
}

// コンテンツ所有者の確認
const content = await db
  .select()
  .from(learningContents)
  .where(eq(learningContents.id, contentId))
  .get();

if (content?.userId !== userId) {
  return c.json({ 
    success: false, 
    error: 'Unauthorized access' 
  }, { status: 403 });
}
```

### 現在の制限事項
- ヘッダー偽装に対する脆弱性
- セッション管理の欠如
- トークンベースの認証なし

## 現在の実装状況

現在は認証・認可機能は未実装です。以下の機能は今後の実装課題として保留しています：

- ユーザー認証
- アクセス制御
- ヘッダーによるユーザー識別（X-User-Id等）

### 予定している実装方式
```typescript
// 今後実装予定の認証ヘッダー
headers: {
  'X-User-Id': 'user-uuid',  // または JWT token
  'Content-Type': 'application/json'
}

// 今後実装予定の権限チェックロジック
const checkContentAccess = async (userId: string, contentId: string) => {
  // コンテンツ所有者の確認ロジック
};
```

### 実装保留の理由
- 認証基盤の設計が必要
- セキュリティ要件の詳細な検討が必要
- フロントエンド側のログイン機能との連携が必要

## 今後の実装計画

## エラーハンドリング
- 401 Unauthorized: 認証エラー
- 403 Forbidden: 権限エラー

## セキュリティ考慮事項
- トークンの有効期限設定
- CSRF対策
- XSS対策
