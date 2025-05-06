# 学習コンテンツ管理機能の実装手順

## 1. スキーマ定義の追加
- `schema.ts` にlearning_contentsテーブルの定義を追加
- ユーザーテーブルとの関連を定義

## 2. 型定義の作成 ✅
- learning_contentsテーブルに関する型定義を作成
  - CreateLearningContent: 新規作成用の型
  - UpdateLearningContent: 更新用の型
  - LearningContent: レスポンス用の型

## 3. APIエンドポイントの実装
以下のCRUD操作のAPIを実装：

### 3.1 Create (POST /api/learning-contents)
- 新規学習コンテンツの作成
- リクエストボディのバリデーション
- ユーザーIDの検証

### 3.2 Read ✅
- 一覧取得 (GET /api/learning-contents)
  - ユーザーごとの学習コンテンツ一覧
  - ページネーション対応
- 個別取得 (GET /api/learning-contents/{id})
  - 指定されたIDの学習コンテンツ詳細

### 3.3 Update (PUT /api/learning-contents/{id}) ✅
- 既存の学習コンテンツの更新
- 進捗（current_page）の更新
- ノートの更新

### 3.4 Delete (DELETE /api/learning-contents/{id}) ✅
- 学習コンテンツの削除
- 関連するデータの整合性確保

## 4. バリデーションの実装 ✅
- タイトルの文字数制限（255文字以内）
  - CREATE時：zodスキーマで実装
  - UPDATE時：zodスキーマで実装
- ページ数の妥当性チェック（total_page >= current_page）
  - CREATE時：zodスキーマのrefineで実装
  - UPDATE時：zodスキーマのrefineで実装
- 必須項目のチェック
  - CREATE時：zodスキーマで実装
  - UPDATE時：zodスキーマで実装

## 5. エラーハンドリング ✅
- 存在しないコンテンツへのアクセス
  - GET/PUT/DELETE時の404エラー実装済み
- 権限チェック（他ユーザーのコンテンツへのアクセス制御）
  - ※ログイン機能実装時に合わせて実装予定（Issue #1参照）
- データベースエラーの適切な処理
  - 全エンドポイントでの500エラー実装済み

## 6. テストの実装 （保留）
- ※テスト実装は以下の理由により保留
  - テストツールの選定が未完了
  - テスト戦略の検討が必要
  - テスト環境の整備が必要

以下は実装時の検討項目：
- ユニットテスト
- 統合テスト
- エンドポイントのテスト

## 7. ドキュメント
- APIの仕様書の作成
- エンドポイントの使用例の追加

## API動作確認用コマンド

### Create Learning Content
```bash
curl -X POST http://localhost:8787/learning-contents \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "プログラミング入門",
    "totalPage": 300,
    "currentPage": 1,
    "note": "初めてのプログラミング学習"
  }'
```

### Get Learning Contents List
```bash
# 全件取得
curl http://localhost:8787/learning-contents

# ユーザーIDによるフィルタリング
curl http://localhost:8787/learning-contents?userId=your-user-id
curl 'http://localhost:8787/learning-contents?userId=d1335a98-684e-452d-ab64-9a808f2690a1'

# ページネーション
curl 'http://localhost:8787/learning-contents?page=1&limit=10'
```

### Get Single Learning Content
```bash
curl http://localhost:8787/learning-contents/your-content-id
curl http://localhost:8787/learning-contents/a6b9f521-0233-4e96-a4f0-78b4a7c9d5df
```

### Update Learning Content
```bash
curl -X PUT http://localhost:8787/learning-contents/your-content-id \
  -H "Content-Type: application/json" \
  -d '{
    "currentPage": 50,
    "note": "Chapter 3まで完了"
  }'
```

### Delete Learning Content
```bash
curl -X DELETE http://localhost:8787/learning-contents/your-content-id
```

### レスポンス例

#### 正常系レスポンス
```json
{
  "success": true,
  "data": {
    "id": "generated-uuid",
    "userId": "user-uuid",
    "title": "プログラミング入門",
    "totalPage": 300,
    "currentPage": 1,
    "note": "初めてのプログラミング学習",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```
