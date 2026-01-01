# 1) Viewport & Safe Areas

Files
- apps/web/app/layout.tsx
- apps/web/app/globals.css

layout.tsx – ensure viewport and body classes
```tsx
export const metadata = {
  title: 'BuildFlow Pro',
  description: '…',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
```

globals.css – safe areas + base resets
```css
:root { color-scheme: light dark; }
html, body { height: 100%; }
body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
/* Prevent global x-overflow */
html, body, #__next { overflow-x: hidden; }
```
