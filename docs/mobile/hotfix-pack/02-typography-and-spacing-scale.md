# 2) Typography & Spacing Scale

Files
- apps/web/tailwind.config.ts
- apps/web/app/globals.css

Tailwind – ensure container padding & screens
```ts
// tailwind.config.ts
export default {
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', md: '2rem' } },
    extend: {
      screens: { 'xs': '360px' },
    }
  }
}
```

globals.css – readable mobile text
```css
/* Typography for mobile */
h1 { font-size: clamp(1.25rem, 5vw, 1.75rem); }
h2 { font-size: clamp(1.125rem, 4.5vw, 1.5rem); }
p { line-height: 1.7; }

/* Card spacing */
.card { padding: 1rem; border-radius: 0.75rem; }
```
