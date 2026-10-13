---
description: import for product quoting
---

# import

Read docs/replace-salesforce-revenue-cloud.md. Check actual headers and currency. Run a dry run first, inspect counts, then apply only the intended import. Reconcile source totals.

Run from the repo root:

```bash
node scripts/quotes.mjs import salesforce --dir= --currency= --actor= [--dry-run]
```

Replace placeholders with the user's values. Quote arguments containing spaces. Append --json for structured results. Partial IDs and case-insensitive names work. On ambiguity, list the candidates and stop. Report the records you read or changed. No message or document is sent.
