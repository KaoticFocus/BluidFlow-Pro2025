# 4) Lists → Cards on Mobile

Guideline
- Convert dense rows/tables to stacked cards under md.

Example markup
```tsx
<ul className="space-y-3">
  {items.map(item => (
    <li key={item.id} className="card border shadow-sm md:grid md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <h3 className="text-base font-semibold">{item.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>
      </div>
      <div className="mt-3 md:mt-0 flex items-center gap-2">
        <span className="badge">{item.status}</span>
        <button className="btn-secondary">Open</button>
      </div>
    </li>
  ))}
</ul>
```
