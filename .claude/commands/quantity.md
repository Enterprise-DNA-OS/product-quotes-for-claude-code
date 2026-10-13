---
description: Change a quoted product quantity
---

# Change quantity

Read the complete quote and confirm the intended product and count. Run `node scripts/quotes.mjs quantity <quote> --product=<product> --quantity=<positive-integer> --actor="<operator>"`. Quote names with spaces. This saves the previous revision and invalidates approval. Issued quotes must be revised first. Read bundle-check afterwards because required quantities can change. Append --json for structured output. Ambiguity lists matches and exits 1. Nothing is sent.
