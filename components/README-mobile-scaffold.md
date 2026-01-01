# Mobile Scaffold (NavMobileSheet + Globals)

This PR adds a minimal mobile scaffold to accelerate the mobile-first pass. Nothing is wired automatically.

Contents
- styles/mobile-globals.css — baseline safe-areas, overflow protection, touch targets, wrapping, dvh utilities.
- components/NavMobileSheet.tsx — bottom-sheet style mobile nav (backdrop, Esc/backdrop close, body scroll lock).
- utils/bodyScrollLock.ts — lock/unlock body scroll when sheet/dialog is open.

How to wire (example)
1) Import the globals CSS in your main CSS (e.g., app/globals.css or styles/globals.css):

```css
@import '../styles/mobile-globals.css';
```

2) Use the NavMobileSheet in your layout on small screens:

```tsx
'use client';
import React, { useState } from 'react';
import NavMobileSheet from '@/components/NavMobileSheet';

export function MobileNavExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button aria-label="Open menu" onClick={() => setOpen(true)} style={{ width: 44, height: 44 }}>☰</button>
      <NavMobileSheet isOpen={open} onClose={() => setOpen(false)}>
        {/* Replace with real nav links */}
        <nav>
          <a href="/tasks">Tasks</a><br/>
          <a href="/meetings">Meetings</a><br/>
          <a href="/schedule">Schedule</a><br/>
          <a href="/time-clock">Time Clock</a><br/>
          <a href="/docs">Docs</a><br/>
          <a href="/ai-actions">AI Actions</a>
        </nav>
      </NavMobileSheet>
    </>
  );
}
```

Notes
- Keep interactive controls ≥44×44px and ensure visible :focus-visible.
- For a full a11y focus trap, integrate your dialog/sheet of choice or add a small focus-trap helper.
- Use dynamic imports for heavy components when rendering inside the sheet.
