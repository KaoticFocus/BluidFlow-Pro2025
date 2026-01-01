# Hotfix 1: Viewport & Safe Areas

Tasks
- Add meta viewport with viewport-fit=cover.
- Add min-height:100dvh to full-height sections.
- Apply body padding with env(safe-area-inset-*) for top/bottom bars.

CSS Snippet
```css
html, body { overflow-x: hidden; }
.full-height { min-height: 100dvh; }
body { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
```
