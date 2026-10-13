---
description: mark issued for product quoting
---

# mark-issued

Record only a quote the operator says was already issued elsewhere. This command does not send, sign or record acceptance.

Run from the repo root:

```bash
node scripts/quotes.mjs mark-issued <quote> --actor=
```

Replace placeholders with the user's values. Quote arguments containing spaces. Append --json for structured results. Partial IDs and case-insensitive names work. On ambiguity, list the candidates and stop. Report the records you read or changed. No message or document is sent.
