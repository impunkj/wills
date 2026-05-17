# Shared Utilities

This folder bundles the lib utilities and UI primitives that the section components import. Drop these into your project so the `@/lib/...` and `@/components/ui/...` imports resolve.

## How to install

Choose **one** of these:

### Option 1 — Mount under your `@/` alias (simplest)

Copy:
- `_shared/lib/*` → `src/lib/`
- `_shared/components/ui/*` → `src/components/ui/`

This works if your project already aliases `@/` to `src/`.

### Option 2 — Add a `@/shared` alias

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/lib/*": ["./src/_shared/lib/*"],
      "@/components/ui/*": ["./src/_shared/components/ui/*"]
    }
  }
}
```

And mirror the resolve config in your bundler (Vite, Webpack, etc.).

## What's Here

### `lib/`
- `format.ts` — Currency, date, and time-ago formatters used in list/detail views.
- `use-debounce.ts` — Debounce hook for search inputs.
- `use-initial-loading.ts` — Skeleton-loading hook that flips `loading → ready` after first paint.
- `utils.ts` — `cn()` className merge helper (used by Tailwind component primitives).

### `components/ui/`
- `dialog.tsx` — Radix-based modal dialog primitive.
- `list-skeleton.tsx` — Loading skeleton for list views.
- `pagination.tsx` — Pagination control for tables.
- `skeleton.tsx` — Generic skeleton block.
- `toaster.tsx` — Toast notification provider/host.

## Required npm dependencies

These primitives depend on the following runtime packages — install them in your project:

```
lucide-react
clsx
tailwind-merge
@radix-ui/react-dialog
sonner
```

(Replace `sonner` if your toaster import uses a different package; check `toaster.tsx`.)
