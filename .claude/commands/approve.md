---
description: approve for product quoting
---

# approve

Read the complete quote, all lines, bundle-check and compliance first. State the revision, margin and discount. Record only the review the user authorised. The actor is an operator label, not authenticated identity.

Run from the repo root:

```bash
node scripts/quotes.mjs approve <quote> --reason= --actor=
```

Replace placeholders with the user's values. Quote arguments containing spaces. Append --json for structured results. Partial IDs and case-insensitive names work. On ambiguity, list the candidates and stop. Report the records you read or changed. No message or document is sent.
