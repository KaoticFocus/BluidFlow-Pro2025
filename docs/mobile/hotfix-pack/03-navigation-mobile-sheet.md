# 3) Navigation: Drawer → Mobile Sheet

Pattern
- Replace left sidebar on <md with a bottom sheet modal to host nav/filters.

Implementation outline
```tsx
// NavSheet.tsx
'use client'
import { useState } from 'react'

export function NavSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button aria-label="Open navigation" className="md:hidden fixed bottom-4 right-4 z-50 btn-primary" onClick={() => setOpen(true)}>Menu</button>
      {open && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto h-1.5 w-10 rounded bg-gray-300 mb-3" />
            {children}
          </div>
        </div>
      )}
    </>
  )
}
```

Usage: render existing nav items inside <NavSheet> on mobile only.

