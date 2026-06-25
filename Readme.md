# コトづくり研究所 Webサイト

これはコトづくり研究所のWebサイトです。

PHPなどの記事の更新機能はあとから追加する予定です。

HTML、SCSS、JavaScriptなどのフロントエンドの技術を使って、Webサイトのデザインやインタラクションを改善していく予定です。

## ディレクトリ構成

```
kotodukuri/
├── index.html
├── css/
│   ├── style.css        … sass からコンパイルされる出力（直接編集しない）
│   └── style.css.map
├── sass/
│   ├── _variables.scss  … 変数・mixin・function の定義
│   └── style.scss       … メイン（これをコンパイルする）
└── js/
    └── main.js
```

## SCSS のコンパイル

`sass/style.scss` を編集し、`css/style.css` へコンパイルする。

```bash
# 監視して自動コンパイル
sass --watch sass/style.scss css/style.css
```

`style.scss` の先頭で各モジュールを読み込んでいる。

```scss
@use "sass:math";
@use "sass:map";
@use "_variables" as *;
```

## 変数（`sass/_variables.scss`）

### カラー

| 変数                | 値        | 用途             |
| ------------------- | --------- | ---------------- |
| `$primary-color`    | `#28598F` | メインカラー     |
| `$accent-color`     | `#E8DE79` | アクセントカラー |
| `$background-color` | `#f0f0f0` | 背景色           |
| `$font-color`       | `#070707` | 基本の文字色     |

### フォント

| 変数            | 値                                  |
| --------------- | ----------------------------------- |
| `$font-primary` | `'Zen Kaku Gothic New', sans-serif` |
| `$font-text`    | `'Zen Kaku Gothic New', sans-serif` |

### スペーシング

`$space-xs`(4px) / `$space-s`(8px) / `$space-m`(16px) / `$space-l`(24px) / `$space-xl`(32px) / `$space-xxl`(40px) / `$space-xxxl`(48px)

### ブレークポイント（`$breakpoints` マップ）

`mobile: 375px` / `tablet: 768px` / `desktop: 800px`

## mixin / function

### `@mixin inner($mw: 1300px, $w: 95%)`

コンテンツの最大幅を制限し、中央寄せする。

```scss
.container {
  @include inner;
}
```

### `@mixin mq($breakpoint: desktop)`

メディアクエリ（`max-width`）を生成する。引数は `$breakpoints` のキー（`mobile` / `tablet` / `desktop`）。指定した幅**以下**のときにスタイルが適用される。

```scss
.box {
  display: flex;
  @include mq(desktop) {
    // 800px 以下
    display: block;
  }
}
```

コンパイル結果：

```css
.box {
  display: flex;
}
@media (max-width: 768px) {
  .box {
    display: block;
  }
}
```

#### 使い方のポイント

- 引数を省略すると `desktop`（800px）が使われる。
  ```scss
  @include mq {
    // = @include mq(desktop) → 800px 以下
    padding: $space-m;
  }
  ```
- セレクタの**中**にネストして書く（プロパティと同じ階層に置く）。
- 複数のブレークポイントを重ねて指定できる。
  ```scss
  .title {
    font-size: rem(32);
    @include mq(tablet) {
      font-size: rem(24);
    }
    @include mq(mobile) {
      font-size: rem(20);
    }
  }
  ```
- ブレークポイントを増やしたいときは `_variables.scss` の `$breakpoints` マップにキーを追加するだけで使えるようになる。

### `@function rem($px-value)`

px 値を rem（基準 14px）に変換して返す。

```scss
.title {
  font-size: rem(28); // → 2rem
}
```
