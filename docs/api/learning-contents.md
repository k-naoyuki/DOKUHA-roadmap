# 学習コンテンツ API仕様書

## 概要
学習コンテンツの作成、取得、更新、削除を行うためのAPIです。

## 共通仕様

### エンドポイントベースURL
```
http://localhost:8787
```

### レスポンス形式
```json
// 成功時
{
  "success": true,
  "data": {/* レスポンスデータ */}
}

// エラー時
{
  "success": false,
  "error": "エラーメッセージ"
}
```

## エンドポイント一覧

### 1. 学習コンテンツ作成
新しい学習コンテンツを作成します。

- **エンドポイント**: `/learning-contents`
- **Method**: `POST`
- **リクエスト例**:
```json
{
  "userId": "uuid-string",
  "title": "プログラミング入門",
  "totalPage": 300,
  "currentPage": 1,
  "note": "初めてのプログラミング学習"
}
```

### 2. 学習コンテンツ一覧取得
- **エンドポイント**: `/learning-contents`
- **Method**: `GET`
- **クエリパラメータ**:
  - `userId`: フィルタリング用（optional）
  - `page`: ページ番号（optional）
  - `limit`: 取得件数（optional）

### 3. 学習コンテンツ個別取得
- **エンドポイント**: `/learning-contents/:id`
- **Method**: `GET`

### 4. 学習コンテンツ更新
- **エンドポイント**: `/learning-contents/:id`
- **Method**: `PUT`
- **リクエスト例**:
```json
{
  "currentPage": 50,
  "note": "Chapter 3まで完了"
}
```

### 5. 学習コンテンツ削除
- **エンドポイント**: `/learning-contents/:id`
- **Method**: `DELETE`

## エラーコード
- `400`: バリデーションエラー
- `404`: リソースが見つからない
- `500`: サーバーエラー
