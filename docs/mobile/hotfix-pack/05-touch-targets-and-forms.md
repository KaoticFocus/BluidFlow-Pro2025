# 5) Touch Targets & Forms

CSS utilities
```css
.btn, button, [role="button"], .input, input, select, textarea { min-height: 44px; }
.btn { padding: 0.5rem 1rem; }
label { font-size: 0.875rem; }
```

Form hints
- Keep labels visible (no placeholder-as-label).
- Use inputmode and autocomplete for mobile keyboards.
```tsx
<input type="tel" inputMode="numeric" autoComplete="one-time-code" />
```
