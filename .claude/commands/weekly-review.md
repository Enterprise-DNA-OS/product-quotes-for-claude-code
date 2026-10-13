---
description: weekly review for product quoting
---

# weekly-review

Run attention, discount-review and compliance separately, then weekly-review. Write the Monday note with owners, quote names, expiry dates and the next recorded action. Never combine currencies.

Run from the repo root:

```bash
node scripts/quotes.mjs weekly-review
```

Replace placeholders with the user's values. Quote arguments containing spaces. Append --json for structured results. Partial IDs and case-insensitive names work. On ambiguity, list the candidates and stop. Report the records you read or changed. No message or document is sent.
