# 6) Transcript Wrapping & Code Blocks

CSS for long content
```css
.transcript, .log, article { overflow-wrap: anywhere; word-break: break-word; hyphens: auto; }
pre, code { white-space: pre-wrap; word-break: break-word; }
```

Usage
- Apply className="transcript" to long AI transcripts/log bodies.
- Keep container overflow-x-hidden; allow pre/code to scroll if needed.
