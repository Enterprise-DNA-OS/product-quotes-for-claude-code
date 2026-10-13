---
description: catalog for product quoting
---

# catalog

Read live records from this command. Explain amounts with their currency and preserve unknown costs as unknown.

Run from the repo root:

```bash
node scripts/quotes.mjs catalog
```

Replace placeholders with the user's values. Quote arguments containing spaces. Append --json for structured results. Partial IDs and case-insensitive names work. On ambiguity, list the candidates and stop. Report the records you read or changed. No message or document is sent.
