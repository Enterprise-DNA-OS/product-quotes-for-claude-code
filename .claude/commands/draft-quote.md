---
description: draft quote for product quoting
---

# draft-quote

Read the quote and compliance findings first. Render into drafts/. It remains a draft, even if a quote was recorded as issued. Do not send it.

Run from the repo root:

```bash
node scripts/quotes.mjs draft-quote <quote>
```

Replace placeholders with the user's values. Quote arguments containing spaces. Append --json for structured results. Partial IDs and case-insensitive names work. On ambiguity, list the candidates and stop. Report the records you read or changed. No message or document is sent.
