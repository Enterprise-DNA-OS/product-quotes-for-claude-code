---
description: terms for product quoting
---

# terms

Read the affected records before changing them. Use the operator identity supplied in this session. Explain changed terms and approval invalidation. Do not guess costs, rates or reasons.

Run from the repo root:

```bash
node scripts/quotes.mjs terms <quote> --terms= --tax-bps= --tax-note= --expires=YYYY-MM-DD --actor=
```

Replace placeholders with the user's values. Quote arguments containing spaces. Append --json for structured results. Partial IDs and case-insensitive names work. On ambiguity, list the candidates and stop. Report the records you read or changed. No message or document is sent.
