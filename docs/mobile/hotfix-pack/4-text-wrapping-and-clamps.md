# Hotfix 4: Text Wrapping & Clamps

Tasks
- Wrap long content (transcripts, notes, IDs).
- Clamp previews (e.g., 2–3 lines) with expand on detail.

CSS Snippet
```css
.content, .prose { overflow-wrap: anywhere; word-break: break-word; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
```
