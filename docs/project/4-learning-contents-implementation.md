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

### 3.1 Create (POST /api/learning-contents) ✅
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

## 7. ドキュメント ✅
- APIの仕様書の作成
  - `/docs/api/learning-contents.md` を作成
  - エンドポイント仕様を詳細に記載
  - リクエスト/レスポンス形式を明確化
- エンドポイントの使用例
  - 本ドキュメントの「API動作確認用コマンド」セクションに記載済み

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

## 振り返り

### 実装完了した項目
1. データベーススキーマ
   - learning_contentsテーブルの設計と実装
   - usersテーブルとの関連付け

2. APIエンドポイント
   - CRUD操作の基本機能を全て実装
   - データ整合性の確保
   - エラーハンドリングの実装

3. バリデーション
   - zodを使用した入力値の検証
   - ビジネスロジックに基づく制約の実装

4. ドキュメント
   - API仕様書の作成
   - 動作確認用コマンドの整備

### 保留した項目と理由
1. 認証・認可機能
   - ログイン機能との連携が必要
   - セキュリティ要件の詳細な検討が必要
   - Issue #1として別途管理

2. テスト実装
   - テストツールの選定が必要
   - テスト戦略の検討が必要
   - テスト環境の整備が必要

### 技術的な決定事項
1. データベース設計
   - UUIDを主キーとして採用
   - 外部キー制約による参照整合性の確保
   - タイムスタンプによる変更履歴の管理

2. APIデザイン
   - RESTful APIの原則に従った設計
   - 一貫性のあるレスポンス形式
   - 適切なHTTPステータスコードの使用

### 今後の課題
1. パフォーマンス最適化
   - クエリの最適化
   - インデックス戦略の検討
   - キャッシュの検討

2. 機能拡張の検討
   - 学習進捗の統計情報
   - タグ付けやカテゴリ分類
   - 検索機能の強化

3. 運用面の整備
   - ログ出力の実装
   - モニタリングの検討
   - バックアップ戦略の策定
