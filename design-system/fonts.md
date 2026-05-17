# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Or import in your global CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
```

## Font Usage

- **Headings:** DM Sans (500/600/700)
- **Body text:** DM Sans (400/500)
- **Code / IDs / monospace data:** IBM Plex Mono

The shell (`shell/components/AppShell.tsx`) sets `font-family: 'DM Sans'` on the root container, so most descendants inherit it. Use the `font-mono` Tailwind utility on monospaced elements (Customer IDs, Case IDs, invoice numbers).

```html
<h1 class="text-2xl font-semibold tracking-tight">Page title</h1>
<p class="text-sm text-neutral-600 dark:text-neutral-400">Body copy</p>
<code class="font-mono text-xs">W24-CUST-00045</code>
```
