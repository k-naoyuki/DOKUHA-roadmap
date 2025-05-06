# Dokuha Roadmap Backend

## Getting Started
```txt
pnpm install
pnpm run dev
```

### migration
```txt
pnpm local:migration
```

### 開発中に GUI でDBを確認したい場合
```txt
pnpm studio
```

## Deploying
```txt
pnpm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
pnpm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
