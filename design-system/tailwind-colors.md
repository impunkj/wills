# Tailwind Color Configuration

Wills24 Admin uses Tailwind CSS v4's built-in color palette. No `tailwind.config.js` is needed and no custom colors are defined.

## Color Choices

- **Primary:** `orange` — Used for buttons, links, active nav, key accents, and the brand logo.
- **Secondary:** `yellow` — Used for warnings, mid-priority tags, and secondary highlights.
- **Neutral:** `neutral` — Warm grays used for backgrounds, text, borders, and the sidebar.

## Usage Examples

```html
<!-- Primary button -->
<button class="bg-orange-500 hover:bg-orange-600 text-white">Save</button>

<!-- Subtle primary highlight (active nav / toast) -->
<div class="bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">Active</div>

<!-- Secondary badge -->
<span class="bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300">Warning</span>

<!-- Neutral text -->
<p class="text-neutral-600 dark:text-neutral-400">Body text</p>

<!-- Card surface -->
<div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">…</div>

<!-- Sidebar -->
<aside class="bg-[#1a1a1a] text-neutral-400">…</aside>
```

## Status Badge Convention

- Success / active: `bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400`
- Warning / pending: `bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300`
- Error / critical / overdue: `bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400`
- Info / draft: `bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400`
- Neutral / inactive: `bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300`

## Dark Mode

All section components and the shell use Tailwind `dark:` variants. Make sure your app sets a `dark` class on the root or supports `prefers-color-scheme`.
