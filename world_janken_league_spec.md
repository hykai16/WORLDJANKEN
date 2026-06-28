# World Janken League 仕様書 v0.1

## 1. コンセプト

**World Janken League** は、世界中の誰もが参加できる「競技じゃんけん」Webアプリである。

じゃんけんは、年齢・言語・経験・ゲームスキルに関係なく、誰でもすぐに参加できる。
この強みを活かし、レーティング、ランキング、大会、アバター、演出、配信映えを組み合わせて、
「運だけなのに本気になる」競技体験を作る。

---

## 2. キャッチコピー案

### 日本語

- 運だけなのに、本気になる。
- 今日の世界一は、誰だ。
- 3秒で決まる、世界最強。
- 誰でもできる。だから、世界一が面白い。

### English

- Pure luck. Real competition.
- Who is the best in the world today?
- Three seconds to glory.
- Anyone can play. Anyone can become world champion.

---

## 3. 対応プラットフォーム

### 初期リリース

- Webアプリ
- スマホブラウザ対応
- PCブラウザ対応
- PWA化を検討

### Webアプリを選ぶ理由

- アプリストア審査なしで公開できる
- URL共有だけで参加できる
- 世界中の人がアクセスしやすい
- iOS / Android / PC をまとめて対応できる
- 大会や配信との相性が良い

---

## 4. 対応言語

初期対応言語は以下の2つ。

- 日本語
- 英語

将来的には以下も検討。

- 韓国語
- 中国語
- スペイン語
- ポルトガル語

---

## 5. 基本ゲームルール

プレイヤーはオンライン上の相手とマッチングし、制限時間内に以下のどれかを選ぶ。

- グー / Rock
- チョキ / Scissors
- パー / Paper

勝敗は通常のじゃんけんルールに従う。

- グーはチョキに勝つ
- チョキはパーに勝つ
- パーはグーに勝つ
- 同じ手ならあいこ

---

## 6. 試合形式

### 共通ルール

- 1ラウンドの制限時間：10秒
- 時間切れ・回線切断はどちらも不戦敗（相手の不戦勝）。レート変動は通常の敗北と同じ
- あいこ（引き分け）は即再戦（そのラウンドを再プレイ）。レートに影響しない
- 勝敗確定後、試合全体のレーティングが変動

### 相手傾向データの表示タイミング

- マッチング確定後〜手を選択するまでの10秒間に表示
- 対戦画面内に常時表示し、プレイヤーが参照しながら手を決められる

### BO1形式（通常マッチ）

- 1ラウンド1本勝負
- カジュアル対戦・ランクマッチの基本形式

### BO3形式

- 2本先取（最大3ラウンド）
- 大会・高レート帯マッチで使用

### BO5形式

- 3本先取（最大5ラウンド）
- 決勝戦・公式大会・配信イベント向け
- 観戦・実況向き

---

## 7. レーティングシステム

Eloレーティングをベースにする。

### 初期レート

```text
1000
```

### Kファクター

```text
K = 32
```

すべてのプレイヤーに一律適用。

### 計算式

```text
勝利後レート = 現レート + K × (1 - 期待勝率)
敗北後レート = 現レート + K × (0 - 期待勝率)

期待勝率 = 1 / (1 + 10^((相手レート - 自レート) / 400))
```

### 変動イメージ（K=32の場合）

| 状況 | 変動幅の目安 |
|---|---|
| 同レート相手に勝つ | +16 |
| 200上の相手に勝つ | +26 |
| 200下の相手に勝つ | +6 |
| 同レート相手に負ける | -16 |
| 200上の相手に負ける | -6 |
| 200下の相手に負ける | -26 |

### 表示例

```text
Kai
Rating: 1284
Rank: Gold III
Japan Rank: #421
World Rank: #18,204
```

---

## 8. ランク帯

### レート閾値

| ランク | レート範囲 |
|---|---|
| Beginner | 〜 1049 |
| Bronze III | 1050 〜 1099 |
| Bronze II | 1100 〜 1149 |
| Bronze I | 1150 〜 1199 |
| Silver III | 1200 〜 1249 |
| Silver II | 1250 〜 1299 |
| Silver I | 1300 〜 1349 |
| Gold III | 1350 〜 1399 |
| Gold II | 1400 〜 1449 |
| Gold I | 1450 〜 1499 |
| Platinum III | 1500 〜 1549 |
| Platinum II | 1550 〜 1599 |
| Platinum I | 1600 〜 1649 |
| Diamond III | 1650 〜 1699 |
| Diamond II | 1700 〜 1749 |
| Diamond I | 1750 〜 1799 |
| Master | 1800 〜 1999 |
| Grand Master | 2000 〜 2199 |
| World Class | 2200 〜 2499 |
| Janken King / Janken Queen | 2500 〜 |

- 初期レート1000はBeginner相当
- Janken King / Janken Queen は世界最上位のみが到達するレジェンドランク
- ランクは `rank` をDB保存せずレートから動的に計算する

---

## 9. ランキング

### ランキング種類

- 世界ランキング
- 国別ランキング
- エリア別ランキング（国ごとの地域単位）
- シーズンランキング
- 連勝ランキング
- 大会ランキング

### 国対抗要素

国ごとの勝率や合計勝利数を表示する。

```text
Japan 51.2% vs USA 48.8%
```

---

## 10. 心理戦要素

じゃんけんは基本的に運のゲームだが、相手の傾向を表示することで読み合いを作る。

### 表示タイミング

- 対戦画面（手を選ぶ10秒間）に常時表示
- プレイヤーはデータを見ながら手を決められる

### 表示データ

- 直近の全試合における手の選択率（%）
- 直近10手の履歴

### 表示例

```text
Opponent History
Rock: 48%
Scissors: 22%
Paper: 30%

Last 10 Moves
Rock / Rock / Paper / Scissors / Rock ...
```

これにより、プレイヤーは「次は何を出すか」を予測する楽しさを得られる。

---

## 11. 大会システム

定期的に公式大会を開催する。

### 大会例

- Daily Cup
- Weekly Janken Cup
- Monthly World Cup
- Japan Championship
- World Championship

### 大会形式

- トーナメント制
- スイスドロー制
- レート別大会
- 国別代表戦
- シーズン上位者限定大会

### 参加条件

初期は無料参加を基本とする。

- 誰でも参加可能
- レート制限大会
- シーズン上位者限定大会
- 広告視聴でエントリー可能な大会

---

## 12. 賞金・大会原資の考え方

広告収益をプールし、次回大会の賞金や報酬原資にする構想。

### 例

```text
Next Tournament Prize Pool
¥42,531
```

ユーザーが広告を見ることで、次回大会の賞金プールが増える。

### 注意点

広告収益を賞金として分配する仕組みは、国や地域によって法律上の確認が必要になる。

特に以下は慎重に設計する。

- 賭博に該当しないか
- 景品表示法・懸賞規制に抵触しないか
- 参加費の有無
- 広告視聴と賞金参加権の関係
- 未成年ユーザーの参加
- 海外ユーザーへの賞金送金
- 税務処理

初期段階では、現金賞金ではなく以下の報酬から始める方が安全。

- 限定称号
- 限定アバター
- 限定フレーム
- アプリ内通貨
- ギフトコードではない非換金アイテム

現金賞金を扱う場合は、必ず専門家に確認する。

---

## 13. 広告モデル

### 広告の使い方

- 大会賞金プールへの貢献
- 報酬2倍
- 大会エントリー
- 無料ガチャ
- アバター解放
- 敗北後の再挑戦権

### 広告表示例

```text
Watch an ad to add ¥1 to the next prize pool.
```

日本語：

```text
広告を見ると、次回大会の賞金プールが1円増えます。
```

---

## 14. キャラクター・アバター要素

雀魂のように、ゲーム外の体験を強化する。

### 要素

- キャラクター
- ボイス
- アバター
- スタンプ
- エモート
- 勝利演出
- 敗北演出
- 入場演出
- 称号
- プロフィールフレーム

### ボイス例

日本語：

- 「いくよ！」
- 「読めてたよ」
- 「まだまだ！」
- 「勝負！」
- 「世界一、狙っちゃう？」

English:

- “Let’s go!”
- “I saw that coming.”
- “Not over yet!”
- “Show me your move!”
- “Going for world number one?”

---

## 15. マネタイズ

### 初期

- リワード広告
- バナー広告
- インタースティシャル広告

### 成長後

- アバター販売
- キャラクター販売
- ボイス販売
- バトルパス
- シーズンパス
- 限定スキン
- スポンサー大会
- 公式大会協賛

---

## 16. シーズン制

一定期間ごとにシーズンを区切る。

### 例

```text
Season 1: The First Rock
期間：2026/08/01 - 2026/09/30
```

### シーズン終了時の報酬

- 世界1位称号
- 国別1位称号
- 都道府県1位称号
- 上位10%限定フレーム
- 参加記念バッジ

シーズン終了後、レートは一部リセットする。

---

## 17. 画面構成

### トップ画面

- 今すぐ対戦
- 現在のレート
- 世界ランキング
- 次回大会賞金プール
- 開催中イベント
- 言語切り替え

### マッチング画面

- 対戦相手検索
- 国旗表示
- レート表示
- 通信状態

### 対戦画面

- 相手情報
- 制限時間
- グー / チョキ / パー ボタン
- 相手の過去傾向
- 演出

### 結果画面

- 勝敗
- レート変動
- 連勝数
- 報酬
- 再戦ボタン
- 広告視聴ボタン

### ランキング画面

- 世界
- 国別
- フレンド
- シーズン
- 大会

### 大会画面

- 開催予定
- 賞金プール
- 参加条件
- トーナメント表
- 結果

### プロフィール画面

- ユーザー名
- 国
- レート
- ランク
- 勝率
- よく出す手
- 称号
- アバター

---

## 18. 多言語対応方針

UI文言はすべてキー管理する。

例：

```json
{
  "match.start": {
    "ja": "対戦開始",
    "en": "Match Start"
  },
  "move.rock": {
    "ja": "グー",
    "en": "Rock"
  }
}
```

---

## 19. 技術スタック案

### フロントエンド

- Next.js
- React
- TypeScript
- Tailwind CSS

### バックエンド

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Realtime

### リアルタイム通信

初期案：

- Supabase Realtime

将来的に本格化する場合：

- WebSocketサーバー
- Node.js
- Socket.IO

### 認証

- Googleログイン
- Appleログイン
- メールログイン
- ゲストログイン（ランクマッチ・大会への参加不可）

### 広告

- Google AdSense
- Google Ad Manager
- 将来的にアプリ化する場合は AdMob

### 決済

- Stripe
- アプリ内課金はWeb版以降に検討

---

## 20. データベース設計案

### users

- id
- display_name
- country（自己申告、国名リストから選択）
- area（自己申告、国ごとの地域名リストから選択。例：日本→都道府県、USA→州）
- language
- avatar_id
- rating
- is_guest（boolean）
- created_at

### matches

- id
- player1_id
- player2_id
- winner_id
- match_format（BO1 / BO3 / BO5）
- player1_rating_before
- player1_rating_after
- player2_rating_before
- player2_rating_after
- status（in_progress / completed / cancelled）
- created_at
- completed_at

### match_rounds

- id
- match_id
- round_number（1始まり）
- player1_move（rock / scissors / paper）
- player2_move（rock / scissors / paper）
- result（player1_win / player2_win / draw）
- created_at

### seasons

- id
- name（例：Season 1: The First Rock）
- status（upcoming / active / ended）
- start_at
- end_at
- created_at

### tournaments

- id
- season_id（nullable、シーズン外大会はnull）
- title
- format（single_elimination / swiss）
- match_format（BO1 / BO3 / BO5）
- status（upcoming / entry_open / in_progress / completed）
- prize_pool
- max_participants
- min_rating（nullable、レート制限大会）
- entry_requires_login（boolean、ゲスト排除フラグ）
- start_at
- end_at
- created_at

### tournament_entries

- id
- tournament_id
- user_id
- seed_rating（エントリー時のレート）
- result_rank（nullable、大会終了後に確定）
- created_at

### tournament_rounds

- id
- tournament_id
- round_number（1始まり）
- round_name（例：Round of 16 / Quarterfinal / Semifinal / Final）
- status（pending / in_progress / completed）
- created_at

### tournament_matches

- id
- tournament_id
- tournament_round_id
- bracket_position（トーナメント表上の位置、1始まり）
- match_id（matchesテーブルへの参照、nullable、対戦確定後に設定）
- player1_id（nullable、前ラウンド勝者が確定次第セット）
- player2_id（nullable）
- winner_id（nullable）
- created_at

### ad_rewards

- id
- user_id
- ad_type
- reward_type
- amount
- tournament_id
- created_at

### avatars

- id
- name
- rarity
- image_url
- voice_pack_id

### voice_packs

- id
- character_id
- language
- line_key
- audio_url

---

## 21. MVP機能

最初に作るべき最小構成。

- 日本語 / 英語切り替え
- ユーザー登録（ログイン必須：Google / Apple / メール）
- ゲストプレイ（フリー対戦のみ、ランクマッチ・大会参加不可）
- 1vs1じゃんけん
- レーティング
- ランキング
- シンプルな大会
- 広告視聴
- 賞金プール風の表示
- プロフィール

---

## 22. MVPでやらないこと

最初から入れすぎない。

- 現金賞金の実配布
- 大規模リアルタイム大会
- 複雑なガチャ
- 大量キャラクター
- フルボイス
- ネイティブアプリ化
- NFT / 暗号資産

---

## 23. 開発フェーズ

### Phase 1：プロトタイプ

- じゃんけん対戦
- レート変動
- ランキング
- 日英対応

### Phase 2：大会機能

- 定期大会
- トーナメント表
- エントリー機能
- 大会ランキング

### Phase 3：広告導入

- リワード広告
- 賞金プール風UI
- 広告視聴ログ

### Phase 4：キャラクター要素

- アバター
- スタンプ
- 勝利演出
- ボイス

### Phase 5：公式リーグ化

- シーズン制
- 国対抗
- スポンサー大会
- 配信イベント

---

## 24. リスク

### 法務リスク

賞金・広告・未成年・海外対応には注意が必要。

### 不正対策

- 複数アカウント
- bot
- 通信切断
- レート操作
- 大会談合

### ゲーム性の薄さ

じゃんけん単体では飽きやすい。

対策：

- レート
- シーズン
- 大会
- アバター
- 心理戦
- 国対抗
- イベントルール

---

## 25. 方向性まとめ

World Janken League は、じゃんけんそのものの複雑さではなく、
誰でもできる競技を世界規模に広げることに価値がある。

重要なのは、ゲームを難しくすることではなく、

- 勝ったら嬉しい
- 負けたら悔しい
- ランキングを上げたい
- 大会に出たい
- 世界一を目指したい
- 自分のキャラを育てたい

という感情を作ること。

最初は小さく、Webで公開する。
そこからランキング、大会、広告、キャラクター要素を足していく。

最終的には、

**「世界一参加しやすい競技アプリ」**

を目指す。
